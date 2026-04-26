import { render, screen } from '@testing-library/react';
import App from './App';

test('renders auth screen title', () => {
  render(<App />);
  const title = screen.getByText(/servicetrack pro/i);
  expect(title).toBeInTheDocument();
});
