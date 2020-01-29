# Emperors Data

[![NPM](https://nodei.co/npm/@dailynodemodule/emperor-data.png)](https://nodei.co/npm/@dailynodemodule/emperor-data/)

This package contains a data on emperors and states of the Holy Roman Empire for use as sample data in other projects.

The data was compiled from a Wikipedia page located at [https://en.wikipedia.org/wiki/Holy_Roman_Emperor](https://en.wikipedia.org/wiki/Holy_Roman_Emperor) and [https://en.wikipedia.org/wiki/List_of_states_in_the_Holy_Roman_Empire](https://en.wikipedia.org/wiki/List_of_states_in_the_Holy_Roman_Empire).

The content is licensed under the [Creative Commons Attribution-Share-Alike License 3.0](https://creativecommons.org/licenses/by-sa/3.0/us/).

# Building

To build run `npm run build`. Output will be saved to the `data` folder. The output format is LZMA compressed MessagePack (e.g. .xz) to save space when publishing to NPM.

# Installing

Once built, you can decompress the MessagePack files with `npm run decompress`.

# Using

To access the data use `require('@dailynodemodule/emperor-data')`. The module exposes two Array-like objects `emperors` and `states`. The data and loaded at runtime to avoid memory constraints.