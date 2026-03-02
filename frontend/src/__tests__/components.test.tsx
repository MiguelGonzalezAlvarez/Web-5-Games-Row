import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HaircutCounter from '../components/haircut/HaircutCounter';
import MatchPredictor from '../components/predictor/MatchPredictor';

vi.mock('../utils/api', () => ({
  api: {
    getChallengeStatus: vi.fn(),
  },
}));

const { api } = require('../utils/api');

describe('HaircutCounter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    api.getChallengeStatus.mockImplementation(
      () => new Promise(() => {})
    );

    render(<HaircutCounter />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders challenge data when loaded', async () => {
    api.getChallengeStatus.mockResolvedValue({
      days_since_start: 500,
      current_streak: 3,
      target_streak: 5,
      is_challenge_complete: false,
      motivational_message: 'Three wins! The end is near!',
      next_match_date: '2026-03-15T15:00:00Z',
      next_match_home_team: 'Manchester United',
      next_match_away_team: 'Aston Villa',
    });

    render(<HaircutCounter />);

    await waitFor(() => {
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });

  it('renders error state on failure', async () => {
    api.getChallengeStatus.mockRejectedValue(new Error('Network error'));

    render(<HaircutCounter />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});

describe('MatchPredictor', () => {
  it('renders match predictor', () => {
    render(<MatchPredictor />);
    expect(screen.getByText(/match predictor/i)).toBeInTheDocument();
  });

  it('renders team names', () => {
    render(<MatchPredictor />);
    expect(screen.getByText('Man United')).toBeInTheDocument();
    expect(screen.getByText('Aston Villa')).toBeInTheDocument();
  });

  it('renders score inputs', () => {
    render(<MatchPredictor />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2);
  });

  it('updates score when buttons are clicked', async () => {
    const user = userEvent.setup();
    render(<MatchPredictor />);

    const plusButtons = screen.getAllByRole('button', { name: '+' });
    await user.click(plusButtons[0]);

    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0]).toHaveValue(3);
  });

  it('submits prediction', async () => {
    const user = userEvent.setup();
    render(<MatchPredictor />);

    const submitButton = screen.getByRole('button', { name: /submit prediction/i });
    await user.click(submitButton);

    expect(screen.getByText(/your prediction/i)).toBeInTheDocument();
  });
});
