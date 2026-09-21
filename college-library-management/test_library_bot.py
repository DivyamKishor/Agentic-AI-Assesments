import unittest

from library_bot import Book, Library


class LibraryTests(unittest.TestCase):
    def setUp(self):
        self.library = Library([
            Book("Python", "Author", "Programming"),
            Book("Data Structures", "Author", "Computer Science", available_copies=0),
        ])

    def test_borrow_available_book(self):
        result = self.library.borrow(" python ", "student-1")
        self.assertIn("successfully borrowed Python", result)
        self.assertEqual(self.library.books["python"].available_copies, 0)

    def test_alias_is_supported(self):
        result = self.library.borrow("DS", "student-1")
        self.assertIn("unavailable", result)

    def test_unavailable_book_cannot_be_borrowed(self):
        result = self.library.borrow("Data Structures", "student-1")
        self.assertIn("unavailable", result)

    def test_unknown_book_is_rejected(self):
        result = self.library.borrow("Algorithms", "student-1")
        self.assertIn("not in our library", result)

    def test_only_the_borrower_can_return_a_book(self):
        self.library.borrow("Python", "student-1")
        wrong_user = self.library.return_book("Python", "student-2")
        self.assertIn("have not borrowed", wrong_user)
        correct_user = self.library.return_book("Python", "student-1")
        self.assertIn("successfully returned Python", correct_user)

    def test_search_matches_category(self):
        results = self.library.search("computer science")
        self.assertEqual([book.title for book in results], ["Data Structures"])


if __name__ == "__main__":
    unittest.main()
