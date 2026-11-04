// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import AboutSection from '../../components/AboutSection';

describe('AboutSection', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the heading', () => {
    render(<AboutSection />);
    expect(
      screen.getByRole('heading', { name: /About Lucky Pick Canada/i })
    ).toBeInTheDocument();
  });

  it('renders the interactive Lucky Meter generator link', () => {
    render(<AboutSection />);
    const link = screen.getByRole('link', { name: /interactive Lucky Meter generator/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/lucky-meter');
  });

  it('renders the Community Lucky Stories section link to the homepage stories section', () => {
    render(<AboutSection />);
    const link = screen.getByRole('link', { name: /Community Lucky Stories section/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/#community-stories');
  });

  it('does not send the stories link through the /stories redirect', () => {
    render(<AboutSection />);
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).not.toContain('/stories');
  });

  it('renders the Canadian Lucky Map link', () => {
    render(<AboutSection />);
    const link = screen.getByRole('link', { name: /Canadian Lucky Map/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/map');
  });
});
