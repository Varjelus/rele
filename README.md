rele
---
An IRC client

Obtaining
-
`git clone https://github.com/Varjelus/rele.git rele`

Building
-
[Varjelus/nodebob](https://github.com/Varjelus/nodebob) is a tool for simplifying
NW.js app packaging. As of September 2015 it supports only 64-bit versions
of Windows (tested on 7 & 10).

Run `git clone https://github.com/Varjelus/nodebob.git nodebob`
Move these files to `nodebob/sources`
Run `nodebob/build.bat`
Packaged app will be in the `release` folder

Usage
-
Run the main executable. On the bottom-left corner is a +-button which you can
join networks with. Default name values are from your system environment variables.

After successfully joining a network you can use the top-right +-button to join
channels or open queries.

F12 opens Chromium dev tools.

Design guidelines
-
* Language agnosticism: buttons, inputs etc. should not need additional labels.
* Ease of customisation: smart methods and clear names.
* Module separation: Keep UI manipulating code separate from underlying mechanics.

License
-
MIT
