#!/usr/bin/env python3

import os
import sys
import requests

def ShowHelp():
    print("Script for initializing Lancelot.js project")
    print("Usage:")
    print("python init.py width height")
    print("width - width of game container in pixels (> 300 recommended)")
    print("height - height of game container in pixels (> 300 recommended)")

if len(sys.argv) == 2 and sys.argv[1] == "-help":
    ShowHelp()
    exit(0)
elif len(sys.argv) != 3:
    ShowHelp()
    exit(1)

def CreateLibFiles():
    if not os.path.exists("lib"):
        os.makedirs("lib")
    URL = "https://raw.githubusercontent.com/DonDejvo/Lancelot/main/"
    corejsPage = requests.get(URL + "core.js", allow_redirects=True)
    open("lib/core.js", "wb").write(corejsPage.content)
    corecssPage = requests.get(URL + "core.css", allow_redirects=True)
    open("lib/core.css", "wb").write(corecssPage.content)

def CreateMainjs():
    if not os.path.exists("src"):
        os.makedirs("src")
    open("src/main.js", "w").write("""
    import * as Lancelot from "../lib/core.js";
    class Game {{
        constructor() {{
            this._Init();
        }}
        _Init() {{
            this._sceneManager = new Lancelot.SceneManager();

            this._renderer = new Lancelot.Renderer({{
                container: document.getElementById("game-container"),
                canvas: document.getElementById("canvas"),
                width: {width},
                height: {height},
                scenes: this._sceneManager
            }});

            this._engine = new Lancelot.Engine({{
                scenes: this._sceneManager,
                renderer: this._renderer,
                start: this._Preload.bind(this)
            }});
        }}
        _Preload() {{

        }}
    }}
    window.addEventListener("DOMContentLoaded", () => new Game());
    """.format(width = sys.argv[1], height = sys.argv[2]))

def CreateIndexhtml():
    open("index.html", "w").write("""
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <link rel="stylesheet" href="lib/core.css">
    </head>
    <body>
        <div id="game-container">
            <div id="play-section" class="game-section">
                <canvas id="canvas"></canvas>
            </div>
        </div>
        <script src="src/main.js" type="module"></script>
    </body>
    </html>
    """)

CreateLibFiles()
CreateMainjs()
CreateIndexhtml()

