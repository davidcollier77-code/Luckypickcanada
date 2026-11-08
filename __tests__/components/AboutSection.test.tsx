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

  it('renders the interactive Luck Generator link', () => {
    render(<AboutSection />);
    const link = screen.getByRole('link', { name: /interactive Luck Generator/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/lucky-meter');
  });

  it('renders the Lucky Community Stories section link to the homepage stories section', () => {
    render(<AboutSection />);
    const link = screen.getByRole('link', { name: /Lucky Community Stories section/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/#community-stories');
  });

  it('does not send the stories link through the /stories redirect', () => {
    render(<AboutSection />);
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).not.toContain('/stories');
  });

  it('renders the Lucky Community Stories map link', () => {
    render(<AboutSection />);
    const link = screen.getByRole('link', { name: /Lucky Community Stories map/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/map');
  });
});
