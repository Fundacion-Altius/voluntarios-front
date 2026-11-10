import { act, render, screen } from '@testing-library/react';
import { useCountUp } from './useCountUp';

function Probe({ target }: { target: number }) {
  const value = useCountUp(target, 1000);
  return <span data-testid="count">{Math.round(value * 100) / 100}</span>;
}

describe('useCountUp', () => {
  const realRaf = window.requestAnimationFrame;
  const realCaf = window.cancelAnimationFrame;
  const realMatchMedia = window.matchMedia;
  let now = 1000;
  let nowSpy: jest.SpyInstance;
  let rafCallback: FrameRequestCallback | null = null;

  beforeEach(() => {
    now = 1000;
    rafCallback = null;
    nowSpy = jest.spyOn(performance, 'now').mockImplementation(() => now);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: jest.fn(() => ({ matches: false })),
    });
    window.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    }) as unknown as typeof requestAnimationFrame;
    window.cancelAnimationFrame = jest.fn();
  });

  afterEach(() => {
    nowSpy.mockRestore();
    window.requestAnimationFrame = realRaf;
    window.cancelAnimationFrame = realCaf;
    if (realMatchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: realMatchMedia,
      });
    }
  });

  it('starts at zero then eases toward the target', () => {
    render(<Probe target={100} />);
    expect(screen.getByTestId('count')).toHaveTextContent('0');

    act(() => {
      now = 1500;
      rafCallback?.(1500);
    });
    // ease-out cubic at p=0.5 => 0.875 * 100
    expect(screen.getByTestId('count')).toHaveTextContent('87.5');
  });

  it('snaps to the exact target at the end', () => {
    render(<Probe target={72.73} />);
    act(() => {
      now = 1500;
      rafCallback?.(1500);
    });
    expect(screen.getByTestId('count')).not.toHaveTextContent('72.73');

    act(() => {
      now = 2500;
      rafCallback?.(2500);
    });
    expect(screen.getByTestId('count')).toHaveTextContent('72.73');
  });

  it('jumps straight to the target with prefers-reduced-motion', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: jest.fn(() => ({ matches: true })),
    });
    const rafSpy = jest.spyOn(window, 'requestAnimationFrame');
    render(<Probe target={42} />);
    expect(screen.getByTestId('count')).toHaveTextContent('42');
    expect(rafSpy).not.toHaveBeenCalled();
  });
});
