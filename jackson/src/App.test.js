import { render, screen } from '@testing-library/react';
import App from './App';

test('renders jackson navigation', () => {
  render(<App />);
  const logoElement = screen.getByText(/jackson/i);
  expect(logoElement).toBeInTheDocument();
});