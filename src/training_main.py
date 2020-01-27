"""
This is the main training module.

Args in cmd:
    --data_dir: directory of the data. the subfolders in the top level
        of this directory will be assumed to correspond to the classes
        (species) and their names that will be learned. Subsequently,
        all subfolders for each species will be crawled for samples.
    --export_dir: directory for exports
    --cap: maximal amount of samples to load per class
    --epochs: amount of training epochs

Usage example:
    python training_main.py --data_dir="C:/Wingbeats"
        --export_dir="." --cap=15000 --epochs=3

"""

import argparse
from model import conv1d

# get and parse arguments
parser = argparse.ArgumentParser()
parser.add_argument("--data_dir", type=str, default=".", help="Directory of the Wingbeats data.")
parser.add_argument("--export_dir", type=str, default=".", help="Directory for exports.")
parser.add_argument("--cap", type=int, default=None, help="Maximal amount of samples to load per class.")
parser.add_argument("--epochs", type=int, default=3, help="Amount of training epochs.")
args = parser.parse_args()

# build model, train, export
m = conv1d.Conv1D(args.data_dir, args.export_dir, args.cap, args.epochs)
m.load_data()
m.build_model()
m.train_model()
m.export_model()
