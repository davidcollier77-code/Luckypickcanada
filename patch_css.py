with open("app/globals.css", "a") as f:
    f.write('''

/* Living Blue Energy Border (Plasma Glow) */
@keyframes plasma-glow {
  0%, 100% {
    box-shadow: 0 0 15px 2px rgba(59, 130, 246, 0.4), inset 0 0 10px rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 35px 8px rgba(96, 165, 250, 0.8), inset 0 0 20px rgba(96, 165, 250, 0.5);
    border-color: rgba(96, 165, 250, 0.8);
  }
}

.animate-plasma-glow {
  animation: plasma-glow 2s ease-in-out infinite;
  border: 2px solid rgba(59, 130, 246, 0.5);
  background-color: rgba(30, 58, 138, 0.1);
  border-radius: 1.5rem; /* 24px */
  padding: 1.5rem;
  transition: all 1s ease-out; /* Smooth transition when classes are removed */
}
''')
