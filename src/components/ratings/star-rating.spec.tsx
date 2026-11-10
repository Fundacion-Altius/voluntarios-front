import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating } from './star-rating';

describe('StarRating Component', () => {
  it('renders correct number of stars', () => {
    render(<StarRating value={0} onChange={() => {}} maxRating={5} />);
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
  });

  it('displays correct rating', () => {
    render(<StarRating value={3} onChange={() => {}} maxRating={5} />);
    const filledStars = screen.getAllByTestId('star-filled');
    const emptyStars = screen.getAllByTestId('star-empty');
    
    expect(filledStars).toHaveLength(3);
    expect(emptyStars).toHaveLength(2);
  });

  it('calls onChange with correct value when star is clicked', () => {
    const handleChange = jest.fn();
    render(<StarRating value={0} onChange={handleChange} maxRating={5} />);
    const stars = screen.getAllByRole('button');
    
    fireEvent.click(stars[2]); // Click on the 3rd star (value = 3)
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('does not call onChange when readonly', () => {
    const handleChange = jest.fn();
    render(<StarRating value={2} onChange={handleChange} maxRating={5} readOnly={true} />);
    const stars = screen.getAllByRole('button');
    
    fireEvent.click(stars[3]); // Try to click on 4th star
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('uses custom size class when provided', () => {
    render(<StarRating value={0} onChange={() => {}} maxRating={3} size="w-8 h-8" />);
    const starIcons = screen.getAllByTestId(/star-/);
    starIcons.forEach(star => {
      expect(star).toHaveClass('w-8 h-8');
    });
  });

  it('has correct aria labels', () => {
    render(<StarRating value={0} onChange={() => {}} maxRating={5} />);
    const stars = screen.getAllByRole('button');
    
    stars.forEach((star, index) => {
      expect(star).toHaveAttribute('aria-label', `Rate ${index + 1} out of 5`);
    });
  });
});