const Main = () => {
  const arrowKeys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];
  const typingKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
    , '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '.', ' ', '!', '?', '/'];
  const boundaries = {top: 32, bottom: 992, left: 0, right: 1920};
  const redrawRate = 1000 / 30;
  const moveRate = 16;
  const maxTop = 32;

  let positionY = maxTop;
  let positionX = 0;
  let movingX = 0;
  let movingY = 0;
  let points = 0;
  let faceOverride = null;

  const setup = () => {
    destroy();
    document.addEventListener('keydown', handleKeyPress);
    drawChatBox();
  };
  const destroy = () => {
    document.removeEventListener('keydown', handleKeyPress);
  };

  const handleKeyPress = e => {
    if ('Enter' === e.key) {
      handleEnterPress(e.key);
      return;
    }
    if ('Backspace' === e.key) {
      handleBackspacePress(e.key);
      return;
    }
    if (arrowKeys.find(i => i === e.key)) {
      handleArrowPress(e.key);
      return;
    }
    if (typingKeys.some(i => i === e.key || i.toLocaleUpperCase() === e.key)) {
      handleTypingPress(e.key);
    }
  };

  const move = () => {
      positionX = positionX + movingX;
      positionY = positionY + movingY;

      positionX = positionX < boundaries.left ? boundaries.left : positionX + 100 > boundaries.right ? boundaries.right - 100 : positionX;
      positionY = positionY < boundaries.top ? boundaries.top : positionY + 100 > boundaries.bottom ? boundaries.bottom - 100 : positionY;
      socket.emit('move', {x: positionX, y: positionY});
  };

  const handleArrowPress = key => {
    if (key === 'ArrowLeft') {
      movingX = movingX < 0 ? 0 : -moveRate;
      movingY = 0;
    }
    if (key === 'ArrowRight') {
      movingX = movingX > 0 ? 0 : moveRate;
      movingY = 0;
    }
    if (key === 'ArrowDown') {
      movingY = movingY > 0 ? 0 : moveRate;
      movingX = 0;
    }
    if (key === 'ArrowUp') {
      movingY = movingY < 0 ? 0 : -moveRate;
      movingX = 0;
    }
  };

  const handleTypingPress = key => {
    const i = document.getElementById('command');
    i.value += key;
  };

  const handleBackspacePress = _ => {
    const i = document.getElementById('command');
    if (i.value.length > 0) {
      i.value = i.value.slice(0, -1);
    }
  };

  const handleEnterPress = _ => {
    const i = document.getElementById('command');
    if (i.value.length > 0) {
      executeCommand(i.value);
      i.value = '';
    }
  };

  const executeCommand = command => {
    socket.emit('user message', command);
  };

  const redraw = (objects) => {
    Object.entries(objects.positions).forEach(box => {
      drawBox(box[0], box[1].color, box[1].x, box[1].y, box[1].face, box[1].name);
    });

    Object.entries(objects.goodies).forEach(box => {
      drawGoody(box[0], box[1].x, box[1].y);
    });
  };

  socket.on('user connected', function(msg) {
    addChatMessage(`${msg.user}: ${msg.message}`);
  });

  socket.on('user disconnected', function(msg) {
    let b = document.getElementById(msg.id);
    if (b) {
      mainEl().removeChild(b);
    }
    addChatMessage(`${msg.user}: ${msg.message}`);
  });

  socket.on('redraw', function(msg) {
    redraw(msg);
  });

  socket.on('setup', function(msg) {
    positionY = msg.y;
    positionX = msg.x;
  });

  socket.on('user message', function(msg) {
    addChatMessage(`${msg.user}: ${msg.message}`);
  });

  socket.on('pm received', function(msg) {
    addChatMessage(`(FROM) ${msg.user}: ${msg.message}`);
  });

  socket.on('pm sent', function(msg) {
    addChatMessage(`(TO) ${msg.user}: ${msg.message}`);
  });

  socket.on('score', function(msg) {
    points += msg.points;
    document.getElementById('points').innerHTML = points;
    faceOverride = 'XD';
    setTimeout(() => {
      faceOverride = null;
      }, 500);
  });

  socket.on('remove goody', function(msg) {
    let b = document.getElementById(msg.id);
    if (b) {
      mainEl().removeChild(b);
    }
  });

  const mainEl = () => {
    return document.getElementsByTagName('main')[0];
  };

  const addChatMessage = msg => {
    const cb = document.getElementById('chat-box');
    const line = document.createElement('div');
    line.innerText = msg;
    cb.appendChild(line);
    line.scrollIntoView();
  };

  const drawChatBox = () => {
    const cb = document.createElement('div');
    cb.id = 'chat-box';
    cb.classList.add('chat-box');
    cb.style.top = `${maxTop + 8}px`;
    mainEl().appendChild(cb);
  };

  const drawBox = (boxId, color, x, y, face, name) => {
    let b = document.getElementById(boxId);
    if (!b) {
      b = document.createElement('div');
      b.id = boxId;
      b.classList.add('box');
      b.style.background = `${color}`;
      mainEl().appendChild(b);
    }
    b.style.left = `${x}px`;
    b.style.top = `${y}px`;
    b.innerHTML = (name) ? `<span class="name--container"><span class="name">${name}</span></span>` : '';
    b.innerHTML += boxId === socket.id ? faceOverride ?? face : face;
  };

  const drawGoody = (goodyId, x, y) => {
    let b = document.getElementById(goodyId);
    if (!b) {
      b = document.createElement('div');
      b.id = goodyId;
      b.classList.add('goody');
      mainEl().appendChild(b);
    }
    b.style.left = `${x}px`;
    b.style.top = `${y}px`;
  };

  setInterval(() => {
    move();
  }, redrawRate);

  setup();
};

export default Main;
