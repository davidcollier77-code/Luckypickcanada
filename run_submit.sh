#!/bin/bash
TITLE=$(cat pr_title.txt)
COMMIT_MSG=$(cat commit_message.txt)
DESC=$(cat pr_description.md)
submit jules-16003753767612244476-16beeb99 "$COMMIT_MSG" "$TITLE" "$DESC"
