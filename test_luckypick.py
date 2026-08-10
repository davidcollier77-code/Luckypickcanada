import pytest
from luckypick import generate_numbers

def test_generate_numbers_six_pick():
    numbers = generate_numbers(6, 49)
    assert len(numbers) == 6
    assert all(1 <= n <= 49 for n in numbers)
    assert len(set(numbers)) == 6
    assert numbers == sorted(numbers)

def test_generate_numbers_seven_pick():
    numbers = generate_numbers(7, 50)
    assert len(numbers) == 7
    assert all(1 <= n <= 50 for n in numbers)
    assert len(set(numbers)) == 7
    assert numbers == sorted(numbers)
