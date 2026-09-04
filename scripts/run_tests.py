#!/usr/bin/env python3
import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
os.environ.setdefault("PYDANTIC_DISABLE_PLUGINS", "1")

if __name__ == "__main__":
    loader = unittest.TestLoader()
    suite = loader.discover(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "tests")), pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
