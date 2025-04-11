import { render, screen } from '@testing-library/react';
import App from './App';

test('renders jsong navigation', () => {
  render(<App />);
  const logoElement = screen.getByText(/jsong/i);
  expect(logoElement).toBeInTheDocument();
});