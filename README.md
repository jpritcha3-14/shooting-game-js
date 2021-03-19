# Retro-Style Alien Shooting Game
![title](https://raw.githubusercontent.com/jpritcha3-14/shooting-game-js/master/imgs/preview_title.png)
![preview](https://raw.githubusercontent.com/jpritcha3-14/shooting-game-js/master/imgs/preview.png)

## Play
Play the game [right here on GitHub Pages](https://jpritcha3-14.github.io/shooting-game-js/)

### Controls 
- WASD: Move the ship
- Space: Fire a missile
- Shift: Activate the ship's shield
- F: Drop a bomb
- R: Restart from Wave 1 after a game over
- C: Restart from the last 5-Wave checkpoint after a game over 

## Motivation
This project is based on [a game I wrote in Python a few years back using Pygame](https://github.com/jpritcha3-14/shooting-game).  I wanted to make a similar game that I could more easily share with other people, as well as get some experience with the HTML5 canvas element and JavaScript.  The canvas drawing functions offered through JavaScript are similar to many other 2D drawing APIs, and the animation is silky smooth at any refresh rate when you hook in to the browser's frame drawing schedule.  I find that games make great projects since a large portion of the design process is top-down and visual, and involves both math and creativity.

## What have I learned?
I've gained more of an appreciation for the strengths of JavaScript.  I still think it's a messy language, but I can appreciate its asynchronous/event driven architecture, and its preference for object composition rather than inheritance.  Both of these qualities make it an ideal language for writing games.

### Future Work
- Add more comments, run a linter, refactor for better readability
- Backend with a high score database
- A menu to access high scores, wave select, and other settings
