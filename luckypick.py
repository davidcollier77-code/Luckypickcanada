#!/usr/bin/env python3
"""
luckypick.py

Small runnable script to generate random Canadian lottery numbers.

Usage:
  python3 luckypick.py           # default: six pick
  python3 luckypick.py --game seven-pick
  python3 luckypick.py --count 5 --max 40

This file was added to provide a minimal runnable example for the repository.
"""

import argparse
import random
import sys

GAMES = {
    "six-pick": {"count": 6, "max": 49},
    "seven-pick": {"count": 7, "max": 50},
}


def generate_numbers(count: int, max_num: int):
    return sorted(random.sample(range(1, max_num + 1), count))


def main(argv=None):
    parser = argparse.ArgumentParser(description="Generate random lottery numbers (Canada).")
    parser.add_argument("--game", choices=list(GAMES.keys()), default="six-pick",
                        help="Choose a preset game (default: six-pick)")
    parser.add_argument("--count", type=int, help="Number of picks (overrides preset)")
    parser.add_argument("--max", type=int, help="Maximum number (overrides preset)")
    parser.add_argument("--sets", type=int, default=1, help="How many sets to generate")

    args = parser.parse_args(argv)

    if args.count and args.max:
        count, max_num = args.count, args.max
    else:
        preset = GAMES.get(args.game)
        if not preset:
            print(f"Unknown game: {args.game}")
            return 2
        count, max_num = preset["count"], preset["max"]

    if args.count and not args.max:
        print("When overriding --count you should also pass --max. Using preset max for the chosen game.")
    if args.max and not args.count:
        print("When overriding --max you should also pass --count. Using preset count for the chosen game.")

    for i in range(args.sets):
        nums = generate_numbers(count, max_num)
        print(f"Set {i+1}: {', '.join(str(n) for n in nums)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
