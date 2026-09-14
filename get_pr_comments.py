import os
import json

def read_comments():
    print("If there are comments, output them:")
    try:
        with open('pr_comments.txt', 'r') as f:
            print(f.read())
    except Exception as e:
        print("Could not read pr_comments.txt", e)

read_comments()
