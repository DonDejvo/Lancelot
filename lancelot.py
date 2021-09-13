#!/usr/bin/env python3

import os
import sys
import requests

def ShowHelp():
    print("Script for initializing and updating Lancelot.js projects")
    print("Usage:")
    print("To initialize new project:")
    print("python lancelot.py --init width height")
    print("width - width of game container in pixels (> 300 recommended)")
    print("height - height of game container in pixels (> 300 recommended)")
    print("To update current project:")
    print("lancelot.py --update")

def CreateLibFiles():

    if not os.path.exists("lib"):
        os.makedirs("lib")

    URL = "https://raw.githubusercontent.com/DonDejvo/Lancelot/main/"

    corejsPage = requests.get(URL + "core.js", allow_redirects=True)
    f1 = open("lib/core.js", "wb")
    f1.write(corejsPage.content)
    f1.close()

    corecssPage = requests.get(URL + "core.css", allow_redirects=True)
    f2 = open("lib/core.css", "wb")
    f2.write(corecssPage.content)
    f2.close()

def CreateMainjs(width, height):

    if not os.path.exists("src"):
        os.makedirs("src")

    f = open("src/main.js", "w")
    content = """
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

        this._resources = new Map();
        this._input = {{}};
    }}
    _Preload() {{

    }}
}}
window.addEventListener("DOMContentLoaded", () => new Game());
    """
    content.format(width = width, height = height)
    f.write(content)
    f.close()


def CreateIndexhtml():
    
    f = open("index.html", "w")
    f.write("""
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
    f.close()



def InitProject(width, height):
    CreateLibFiles()
    CreateIndexhtml()
    CreateMainjs(width, height)

def UpdateProject():
    CreateLibFiles()

argCount = len(sys.argv)

if argCount < 2:
    ShowHelp()
    exit(1)
else:
    action = sys.argv[1]
    if action == "--help":
        ShowHelp()
        exit(0)
    elif action == "--init":
        if argCount < 4:
            ShowHelp()
            exit(1)
        width, height = sys.argv[2], sys.argv[3]
        InitProject(width, height)
    elif action == "--update":
        UpdateProject()
