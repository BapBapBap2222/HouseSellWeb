"""Compatibility entrypoint for the Vietnam linear-regression model.

This project now trains the production prediction model through
`train_vietnam_model.py`, which uses the tinixai/vietnam-real-estates sample,
adds deterministic coordinates, generates 63-province market coverage rows,
and fits a Ridge linear-regression model.
"""

from train_vietnam_model import main


if __name__ == "__main__":
    main()
