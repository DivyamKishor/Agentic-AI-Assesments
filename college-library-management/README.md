# College Library Management

A small command-line library bot written in Python. The original Colab notebook is kept at the repository root; this folder contains the maintainable version of the project.

## Features

- View library opening hours
- List and search books
- Borrow and return books for a specific user
- Prevent borrowing unavailable books
- Prevent users from returning books they did not borrow
- Accept common book aliases such as `DS`, `DB`, and `OS`
- Exit from any prompt by typing `exit`
- Automated tests using Python's standard library

## Run the bot

From the repository root:

```bash
python college-library-management/library_bot.py
```

You can also run it from this directory:

```bash
cd college-library-management
python library_bot.py
```

No third-party dependencies are required.

## Run tests

```bash
python -m unittest discover -s college-library-management -p 'test_*.py'
```

## Example commands

```text
help
library timings
available books
search python
borrow
return
exit
```

The bot asks for a user ID when borrowing or returning a book so that ownership can be validated.

## Next steps

This version stores data in memory for simplicity. A future version could persist books and loans in SQLite, add due dates, and expose the library service through a web or agent interface.
