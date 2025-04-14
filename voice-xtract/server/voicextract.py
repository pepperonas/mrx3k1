# voicextract.py
import os
import torch
import numpy as np
from demucs.pretrained import get_model
from demucs.apply import apply_model
from demucs.audio import AudioFile
import argparse
from pathlib import Path
import tqdm
import soundfile as sf
import tempfile
import subprocess
import gc
import time
import sys
import traceback


class VocalExtractor:
    def __init__(self, model_name="htdemucs", segment_size=None, device=None):
        """
        Initializes the Vocal Extractor with demucs

        Args:
            model_name: Name of the demucs model to use
                       (htdemucs is a good standard model)
            segment_size: Size of audio segments for chunk processing (in seconds)
                         None = entire file is processed at once
            device: Device for processing, 'cuda' or 'cpu'. If None, automatically selected.
        """
        self.report_progress(1, "Loading model...")

        # Automatic device selection if not specified
        if device is None:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device

        self.model_name = model_name
        self.segment_size = segment_size

        try:
            self.model = get_model(model_name)
            self.model.to(self.device)

            # Output model info
            self.report_progress(3, f"Model {model_name} loaded")
            print(f"Using device: {self.device}")
            print(f"Model loaded: {model_name}, Sources: {self.model.sources}")

            # Warmup for the model (can help reduce initial processing latency)
            if self.device == "cuda":
                self.report_progress(4, "Performing model warmup...")
                dummy_input = torch.randn(1, 2, 44100, device=self.device)  # 1 second audio
                with torch.no_grad():
                    _ = self.model(dummy_input)
                torch.cuda.synchronize()
                self.report_progress(5, "Model warmup completed")

        except Exception as e:
            print(f"Error loading model: {e}")
            raise

    def report_progress(self, percentage, message=None):
        """
        Outputs a progress message that can be recognized by the server

        Args:
            percentage: Percentage as an integer (0-100)
            message: Optional message to output with the progress
        """
        # Limit progress to valid values
        percentage = max(0, min(100, int(percentage)))

        print(f"Progress: {percentage}%")
        if message:
            print(f"Status: {message}")

        # Ensure output is displayed immediately
        sys.stdout.flush()

    def save_audio(self, wav, path, sample_rate, format="mp3", bitrate="192k"):
        """
        Saves audio data as MP3 or WAV file using ffmpeg

        Args:
            wav: Audio data as NumPy array
            path: Output path
            sample_rate: Sample rate
            format: Output format ("mp3" or "wav")
            bitrate: Bitrate for MP3 compression
        """
        # Ensure directory exists
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)

        # Clip values between -1 and 1
        wav = np.clip(wav, -1, 1)

        # Temporary WAV file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
            temp_wav_path = temp_wav.name

        # Save WAV (with transposition for correct channel ordering)
        sf.write(temp_wav_path, wav.T, sample_rate)

        if format.lower() == "mp3":
            try:
                # Convert to MP3 with ffmpeg
                self.report_progress(93, f"Converting to {format.upper()}...")
                result = subprocess.run([
                    "ffmpeg", "-y", "-i", temp_wav_path,
                    "-b:a", bitrate, path
                ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

                # Successfully converted
                self.report_progress(96, f"Conversion to {format.upper()} completed")

            except subprocess.CalledProcessError as e:
                print(f"Error converting to MP3: {e}")
                print(f"ffmpeg error: {e.stderr.decode('utf-8') if e.stderr else 'Unknown'}")
                # Fallback: Save as WAV if ffmpeg fails
                import shutil
                path = os.path.splitext(path)[0] + ".wav"
                print(f"Saving as WAV instead: {path}")
                shutil.copy(temp_wav_path, path)

            except FileNotFoundError:
                print("ffmpeg not found. Please install ffmpeg.")
                # Fallback: Save as WAV
                import shutil
                path = os.path.splitext(path)[0] + ".wav"
                print(f"Saving as WAV instead: {path}")
                shutil.copy(temp_wav_path, path)
        else:
            # Simply move the WAV file
            self.report_progress(93, "Finalizing WAV output...")
            import shutil
            shutil.copy(temp_wav_path, path)
            self.report_progress(96, "WAV output finalized")

        # Delete temporary WAV file
        try:
            os.unlink(temp_wav_path)
        except Exception as e:
            print(f"Warning: Could not delete temporary file: {e}")

    def extract_vocals(self, input_file, output_dir, format="mp3", bitrate="192k"):
        """
        Extracts vocals from an audio file

        Args:
            input_file: Path to input audio file
            output_dir: Directory for output files
            format: Output format ("mp3" or "wav")
            bitrate: Bitrate for MP3 compression

        Returns:
            Dictionary with paths to the extracted files
        """
        start_time = time.time()
        self.report_progress(5, "Starting extraction...")

        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        try:
            # Load audio
            self.report_progress(7, "Loading audio file...")
            wav = AudioFile(input_file).read(channels=self.model.audio_channels, samplerate=self.model.samplerate)
            self.report_progress(10, "Audio loaded")

            # Check if wav is already a tensor
            if not isinstance(wav, torch.Tensor):
                wav = torch.tensor(wav)

            # Ensure audio has the right format (batch, channels, time)
            if wav.dim() == 2:  # If it's (channels, time)
                wav = wav.unsqueeze(0)  # Expand to (1, channels, time)
            elif wav.dim() == 1:  # If it's just (time)
                wav = wav.unsqueeze(0).unsqueeze(0)  # Expand to (1, 1, time)

            # Move to the right device
            self.report_progress(12, "Preparing audio data...")
            wav = wav.to(self.device)
            self.report_progress(15, "Audio preparation completed")

            audio_duration = wav.shape[2] / self.model.samplerate
            print(f"Audio duration: {audio_duration:.2f} seconds")
            print(f"Audio shape: {wav.shape}")

            # Define paths (with correct file extension)
            extension = f".{format.lower()}"
            vocal_path = os.path.join(output_dir, f'vocals{extension}')
            accompaniment_path = os.path.join(output_dir, f'accompaniment{extension}')

            # Segmented processing or entire file at once
            use_segments = self.segment_size is not None and wav.shape[2] > self.segment_size * self.model.samplerate

            if use_segments:
                # Process audio in segments
                segment_samples = int(self.segment_size * self.model.samplerate)
                overlap_samples = segment_samples // 4  # 25% overlap

                # Initialize output tensors
                all_vocals = []
                all_accompaniment = []

                # Calculate number of segments
                total_samples = wav.shape[2]
                segments = []

                # Create overlapping segments
                start = 0
                while start < total_samples:
                    end = min(start + segment_samples, total_samples)
                    segments.append((start, end))
                    start += segment_samples - overlap_samples

                self.report_progress(18, f"Segmentation: {len(segments)} segments")
                print(f"Audio will be processed in {len(segments)} segments")

                # Process each segment with progress tracking
                for i, (start, end) in enumerate(segments):
                    segment = wav[:, :, start:end]

                    # Calculate progress for this segment (20-70%)
                    segment_progress = 20 + int((i / len(segments)) * 50)
                    self.report_progress(segment_progress, f"Processing segment {i+1}/{len(segments)}")

                    # Separate audio
                    with torch.no_grad():
                        segment_sources = apply_model(self.model, segment)

                        # Intermediate progress for especially long segments
                        if audio_duration > 180 and i % 2 == 0:  # more updates for long tracks
                            interim_progress = segment_progress + 1
                            self.report_progress(interim_progress, f"Segment {i+1}/{len(segments)} processed")

                    # Indices for demucs sources
                    stem_names = self.model.sources
                    vocal_idx = stem_names.index('vocals')

                    # Extract vocals
                    segment_vocals = segment_sources[:, vocal_idx]

                    # Create accompaniment
                    segment_accompaniment = torch.zeros_like(segment_sources[:, 0])
                    for idx, name in enumerate(stem_names):
                        if idx != vocal_idx:
                            segment_accompaniment += segment_sources[:, idx]

                    # Save segments in lists
                    all_vocals.append(segment_vocals.cpu())
                    all_accompaniment.append(segment_accompaniment.cpu())

                    # Free memory
                    del segment_sources, segment_vocals, segment_accompaniment, segment
                    if self.device == "cuda":
                        torch.cuda.empty_cache()
                    gc.collect()

                    # Update after every third segment or the last segment
                    if i % 3 == 0 or i == len(segments) - 1:
                        elapsed = time.time() - start_time
                        eta = (elapsed / (i + 1)) * (len(segments) - i - 1) if i > 0 else 0
                        self.report_progress(segment_progress,
                                            f"Segment {i+1}/{len(segments)}, ETA: {eta:.1f}s")

                # Combine segments with crossfade
                self.report_progress(70, "Merging segments...")
                vocal_output = self.crossfade_segments(all_vocals, overlap_samples)
                self.report_progress(75, "Vocals merged")
                accompaniment_output = self.crossfade_segments(all_accompaniment, overlap_samples)
                self.report_progress(80, "Accompaniment merged")

                # Save files
                self.report_progress(85, "Saving vocals...")
                self.save_audio(vocal_output[0].numpy(), vocal_path, self.model.samplerate, format, bitrate)
                self.report_progress(90, "Vocals saved")

                self.report_progress(92, "Saving accompaniment...")
                self.save_audio(accompaniment_output[0].numpy(), accompaniment_path, self.model.samplerate, format, bitrate)
                self.report_progress(98, "Accompaniment saved")

                # Free memory
                del vocal_output, accompaniment_output, all_vocals, all_accompaniment, wav
                if self.device == "cuda":
                    torch.cuda.empty_cache()
                gc.collect()

            else:
                # Process the entire file at once
                self.report_progress(20, "Starting audio processing...")
                print("Processing audio file as a whole...")

                with torch.no_grad():
                    self.report_progress(25, "Applying AI model...")
                    start_model = time.time()
                    sources = apply_model(self.model, wav)
                    model_time = time.time() - start_model
                    self.report_progress(70, f"Model applied (Duration: {model_time:.1f}s)")

                # Indices for demucs sources
                stem_names = self.model.sources
                print(f"Available stems: {stem_names}")

                vocal_idx = stem_names.index('vocals') if 'vocals' in stem_names else -1

                if vocal_idx != -1:
                    # Save vocals
                    self.report_progress(75, "Extracting vocals...")
                    vocals = sources[:, vocal_idx].cpu().numpy()
                    self.report_progress(80, "Vocals extracted")

                    self.report_progress(85, "Saving vocals...")
                    self.save_audio(vocals[0], vocal_path, self.model.samplerate, format, bitrate)
                    self.report_progress(90, "Vocals saved")

                    # Create accompaniment (all sources except vocals)
                    self.report_progress(92, "Creating accompaniment...")
                    accompaniment = torch.zeros_like(sources[:, 0])
                    for idx, name in enumerate(stem_names):
                        if idx != vocal_idx:
                            accompaniment += sources[:, idx]

                    self.report_progress(94, "Saving accompaniment...")
                    self.save_audio(accompaniment[0].cpu().numpy(), accompaniment_path, self.model.samplerate, format, bitrate)
                    self.report_progress(98, "Accompaniment saved")

                    # Free memory
                    del vocals, accompaniment, sources, wav
                    if self.device == "cuda":
                        torch.cuda.empty_cache()
                    gc.collect()

                else:
                    print("Warning: No vocals stem found in available stems!")
                    self.report_progress(95, "Error: No vocals stem found!")
                    return {}

            total_time = time.time() - start_time
            self.report_progress(100, f"Extraction completed (Total time: {total_time:.1f}s)")

            return {
                'vocals': vocal_path,
                'accompaniment': accompaniment_path
            }

        except Exception as e:
            print(f"Error during extraction: {str(e)}")
            self.report_progress(99, f"Error: {str(e)}")
            traceback.print_exc()
            return {}

    def crossfade_segments(self, segments, overlap_samples):
        """
        Combines audio segments with crossfade

        Args:
            segments: List of audio segments as tensors
            overlap_samples: Number of overlapping samples

        Returns:
            Combined audio tensor
        """
        if len(segments) == 1:
            return segments[0]

        # Create window for crossfade
        fade_in = torch.linspace(0., 1., overlap_samples)
        fade_out = 1. - fade_in

        # Create first part of output tensor
        result = segments[0][:, :, :-overlap_samples]

        for i in range(len(segments) - 1):
            # Current and next segment
            current = segments[i]
            next_seg = segments[i + 1]

            # Overlap area
            curr_overlap = current[:, :, -overlap_samples:]
            next_overlap = next_seg[:, :, :overlap_samples]

            # Calculate crossfade
            blended = fade_out.view(1, 1, -1) * curr_overlap + fade_in.view(1, 1, -1) * next_overlap

            # Append to result
            result = torch.cat([result, blended], dim=2)

            # Append rest of next segment if it's not the last one
            if i < len(segments) - 2:
                result = torch.cat([result, next_seg[:, :, overlap_samples:-overlap_samples]], dim=2)
            else:
                # For the last segment, append the rest completely
                result = torch.cat([result, next_seg[:, :, overlap_samples:]], dim=2)

            # Update after each concatenation
            if i % 5 == 0:
                self.report_progress(70 + int((i / len(segments)) * 5),
                                    f"Merging segments: {i+1}/{len(segments)-1}")

        return result

    def batch_process(self, input_files, output_dir, format="mp3", bitrate="192k"):
        """
        Processes multiple files in batch mode

        Args:
            input_files: List of input file paths
            output_dir: Base directory for output
            format: Output format ("mp3" or "wav")
            bitrate: Bitrate for MP3 compression

        Returns:
            Dictionary with input files as keys and output paths as values
        """
        results = {}
        total_files = len(input_files)

        for i, input_file in enumerate(input_files):
            file_progress_base = (i / total_files) * 100

            self.report_progress(int(file_progress_base),
                               f"Processing file {i+1}/{total_files}: {os.path.basename(input_file)}")

            # Create a subdirectory with the base name of the file
            file_output_dir = os.path.join(output_dir, os.path.splitext(os.path.basename(input_file))[0])

            # Reload the model when processing many files to avoid memory leaks
            if i > 0 and i % 5 == 0 and self.device == "cuda":
                self.model = get_model(self.model_name)
                self.model.to(self.device)
                torch.cuda.empty_cache()
                gc.collect()

            # Extract vocals
            result = self.extract_vocals(input_file, file_output_dir, format, bitrate)
            results[input_file] = result

            # Progress for this file completed
            next_file_base = ((i + 1) / total_files) * 100
            self.report_progress(int(next_file_base), f"File {i+1}/{total_files} completed")

        return results


def check_ffmpeg():
    """Checks if ffmpeg is available and issues a warning if not"""
    try:
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except FileNotFoundError:
        print("WARNING: ffmpeg not found! MP3 output may not be possible.")
        print("Please install ffmpeg (e.g., with 'brew install ffmpeg' on macOS or")
        print("'apt-get install ffmpeg' on Ubuntu/Debian)")
        return False


def main():
    parser = argparse.ArgumentParser(description='VoiceXtract - Extract vocals from music files')
    parser.add_argument('input', help='Input file or directory with audio files')
    parser.add_argument('-o', '--output', default='output', help='Output directory (default: output)')
    parser.add_argument('-m', '--model', default='htdemucs',
                        help='Name of the model to use (default: htdemucs)')
    parser.add_argument('-f', '--format', default='mp3', choices=['mp3', 'wav'], help='Output format (default: mp3)')
    parser.add_argument('-b', '--bitrate', default='192k', help='Bitrate for MP3 (default: 192k)')
    parser.add_argument('-r', '--recursive', action='store_true', help='Search directories recursively')
    parser.add_argument('-s', '--segment', type=int,
                        help='Segment size in seconds for chunk processing (reduces memory usage)')
    parser.add_argument('-d', '--device', choices=['cuda', 'cpu'],
                        help='Processing device (cuda or cpu, default: automatic)')

    args = parser.parse_args()

    # Check if ffmpeg is installed when MP3 is selected as format
    if args.format.lower() == "mp3" and not check_ffmpeg():
        print("Setting format to WAV due to missing ffmpeg installation...")
        args.format = "wav"

    try:
        print(f"Starting VoiceXtract with model: {args.model}")
        print(f"Output format: {args.format.upper()}, " +
              (f"Bitrate: {args.bitrate}" if args.format.lower() == "mp3" else ""))

        if args.segment:
            print(f"Using segmentation: {args.segment} seconds per segment")

        extractor = VocalExtractor(model_name=args.model, segment_size=args.segment, device=args.device)

        input_path = Path(args.input)
        output_dir = Path(args.output)

        if input_path.is_file():
            # Process single file
            print(f"Processing file: {input_path}")
            result = extractor.extract_vocals(str(input_path), str(output_dir), args.format, args.bitrate)
            print(f"Extracted files: {result}")
        else:
            # Process directory
            audio_extensions = ['.mp3', '.wav', '.flac', '.ogg', '.m4a']

            if args.recursive:
                audio_files = [str(f) for f in input_path.glob('**/*') if
                               f.is_file() and f.suffix.lower() in audio_extensions]
            else:
                audio_files = [str(f) for f in input_path.glob('*') if
                               f.is_file() and f.suffix.lower() in audio_extensions]

            if not audio_files:
                print(f"No audio files found in {input_path}.")
                return

            print(f"Processing {len(audio_files)} audio files...")
            results = extractor.batch_process(audio_files, str(output_dir), args.format, args.bitrate)
            print(f"Processing completed. Output in: {output_dir}")

    except Exception as e:
        print(f"Error during execution: {e}")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()