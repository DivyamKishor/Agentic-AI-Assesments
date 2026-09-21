"""Interactive command-line college library bot.

This module keeps library rules separate from the command-line interface so the
rules can be tested and reused by another interface later.
"""

from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Callable, Dict, List, Optional, Set


LIBRARY_HOURS = "The library is open from 9:00 AM to 6:00 PM, Monday to Saturday."


@dataclass
class Book:
    """A book title and its current inventory."""

    title: str
    author: str
    category: str
    total_copies: int = 1
    available_copies: int = 1


class Library:
    """Manage books and user loans in memory."""

    def __init__(self, books: Optional[List[Book]] = None) -> None:
        initial_books = books or [
            Book("Python", "Community", "Programming"),
            Book("Data Structures", "Community", "Computer Science"),
            Book("Operating Systems", "Community", "Computer Science", available_copies=0),
            Book("Computer Networks", "Community", "Computer Science"),
            Book("Database Management", "Community", "Databases"),
        ]
        self.books: Dict[str, Book] = {self._key(book.title): book for book in initial_books}
        self.loans: Dict[str, Set[str]] = {}
        self.aliases = {
            "ds": "data structures",
            "db": "database management",
            "os": "operating systems",
        }

    @staticmethod
    def _key(value: str) -> str:
        """Normalize whitespace and punctuation for reliable matching."""
        value = value.strip().lower()
        value = re.sub(r"[^a-z0-9]+", " ", value)
        return re.sub(r"\s+", " ", value).strip()

    def resolve_title(self, title: str) -> Optional[str]:
        key = self._key(title)
        key = self.aliases.get(key, key)
        if key in self.books:
            return key
        return None

    def search(self, query: str = "") -> List[Book]:
        """Return books whose title, author, or category matches the query."""
        normalized_query = self._key(query)
        return [
            book
            for book in self.books.values()
            if not normalized_query
            or normalized_query in self._key(book.title)
            or normalized_query in self._key(book.author)
            or normalized_query in self._key(book.category)
        ]

    def borrow(self, title: str, user_id: str) -> str:
        key = self.resolve_title(title)
        user = user_id.strip()
        if not user:
            return "Please provide a user ID."
        if key is None:
            return "Sorry, this book is not in our library."
        book = self.books[key]
        if book.available_copies == 0:
            return "Sorry, this book is currently unavailable."
        user_loans = self.loans.setdefault(user, set())
        if key in user_loans:
            return "You have already borrowed this book."
        book.available_copies -= 1
        user_loans.add(key)
        return f"You have successfully borrowed {book.title}."

    def return_book(self, title: str, user_id: str) -> str:
        key = self.resolve_title(title)
        user = user_id.strip()
        if key is None:
            return "This book does not belong to our library."
        if key not in self.loans.get(user, set()):
            return "You cannot return this book because you have not borrowed it."
        self.loans[user].remove(key)
        self.books[key].available_copies += 1
        return f"Thank you! You have successfully returned {self.books[key].title}."


HELP_TEXT = (
    "You can ask me about:\n"
    "- Library timings\n"
    "- Available books\n"
    "- Searching books\n"
    "- Borrowing a book\n"
    "- Returning a book"
)


def format_books(books: List[Book]) -> str:
    if not books:
        return "No books matched your search."
    lines = ["Here are the books in our library:"]
    for book in books:
        status = f"{book.available_copies}/{book.total_copies} available"
        lines.append(f"- {book.title} ({book.category}) : {status}")
    return "\n".join(lines)


def run_bot(
    library: Optional[Library] = None,
    input_fn: Callable[[str], str] = input,
    output_fn: Callable[[str], None] = print,
) -> None:
    """Run the interactive bot. ``input_fn`` and ``output_fn`` enable testing."""
    library = library or Library()
    output_fn("===================================")
    output_fn("   Welcome to College Library Bot")
    output_fn("===================================")
    output_fn("Type 'help' or 'exit' anytime.\n")

    while True:
        command = input_fn("You: ").strip().lower()
        if command == "exit":
            output_fn("Thank you for using the Library Bot. Goodbye!")
            return
        if command in {"help", "?"}:
            output_fn(HELP_TEXT)
        elif "timing" in command or "hour" in command or "open" in command:
            output_fn(LIBRARY_HOURS)
        elif command.startswith("search "):
            output_fn(format_books(library.search(command[7:])))
        elif "book" in command or "available" in command:
            output_fn(format_books(library.search()))
        elif "borrow" in command:
            _handle_transaction(library, "borrow", input_fn, output_fn)
        elif "return" in command:
            _handle_transaction(library, "return", input_fn, output_fn)
        elif command in {"hello", "hi", "hey"}:
            output_fn("Hello! How can I help you?")
        else:
            output_fn("Sorry, I don't understand that. Type 'help' to see what I can do.")


def _handle_transaction(
    library: Library,
    action: str,
    input_fn: Callable[[str], str],
    output_fn: Callable[[str], None],
) -> None:
    user_id = input_fn("Bot: What is your user ID? ").strip()
    if user_id.lower() == "exit":
        output_fn("Thank you for using the Library Bot. Goodbye!")
        raise SystemExit
    title = input_fn("Bot: Which book do you want to " + action + "? ").strip()
    if title.lower() == "exit":
        output_fn("Thank you for using the Library Bot. Goodbye!")
        raise SystemExit
    result = library.borrow(title, user_id) if action == "borrow" else library.return_book(title, user_id)
    output_fn(result)


if __name__ == "__main__":
    run_bot()
