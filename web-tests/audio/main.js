import defaultExport from "https://cdn.jsdelivr.net/gh/DonDejvo/Lancelot/dist/lancelot-cdn-module.min.js";

        const game = new Lancelot.Game({
            width: 640,
            height: 360,
            background: "#EFEFEF",
            preload: preload,
            init: init
        });

        function preload() {
            this.loader.AddAudio("test-audio", "audio01.mp3");
            this.loader.AddAudio("test-effect", "audio02.wav");
        }

        function init() {
            const controlsSection = this.CreateSection("controls");
            controlsSection.classList.add("controls-section");
            controlsSection.innerHTML = `
            <div>
                <label>Music</label>
                <br>
                <input id="music-volume" type="range" min="0" step="0.01" max="1" value="1">
            </div>
            <div>
                <label>Effects</label>
                <br>
                <input id="effects-volume" type="range" min="0" step="0.01" max="1" value="1">
            </div>
            `;
            this.ShowSection("controls");
            this.audio.AddMusic("test-audio");
            this.audio.AddEffect("test-effect");
            document.getElementById("music-volume").addEventListener("input", function() {
                game.audio.music.volume = parseFloat(this.value);
            });
            document.getElementById("music-volume").addEventListener("change", function() {
                game.audio.music.Play("test-audio");
            });
            document.getElementById("effects-volume").addEventListener("input", function() {
                game.audio.effects.volume = parseFloat(this.value);
            });
            document.getElementById("effects-volume").addEventListener("change", function() {
                game.audio.effects.PlayClone("test-effect");
            });
        }