const Main = () => {
  const arrowKeys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];
  const typingKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
    , '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '.', ' ', '!', '?'];
  const redrawRate = 50;
  const moveRate = 16;
  const maxTop = 32;

  let positionY = maxTop;
  let positionX = 0;
  let movingX = 0;
  let movingY = 0;

  const setup = () => {
    destroy();
    document.addEventListener('keydown', handleKeyPress);
    chatMessages();
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

  const handleBackspacePress = key => {
    const i = document.getElementById('command');
    if (i.value.length > 0) {
      i.value = i.value.slice(0, -1);
    }
  };

  const handleEnterPress = key => {
    const i = document.getElementById('command');
    if (i.value.length > 0) {
      executeCommand(i.value);
      i.value = '';
    }
  };

  const executeCommand = command => {
    socket.emit('user message', command);
  };

  const redraw = (boxes) => {
    Object.entries(boxes).forEach(box => {
      drawBox(box[0], box[1].color, box[1].x, box[1].y, box[1].face);
    });
  };

  socket.on('user connected', function(msg) {
    const cb = document.getElementById('chatMessages');
    const line = document.createElement('div');
    line.innerText = `${msg.user}: ${msg.message}`;
    cb.appendChild(line);
  });

  socket.on('user disconnected', function(msg) {
    const cb = document.getElementById('chatMessages');
    const line = document.createElement('div');
    line.innerText = `${msg.user}: ${msg.message}`;
    cb.appendChild(line);
    let b = document.getElementById(msg.id);
    if (b) {
      mainEl().removeChild(b);
    }
  });

  socket.on('redraw', function(msg) {
    redraw(msg);
  });

  socket.on('setup', function(msg) {
    positionY = msg.y;
    positionX = msg.x;
  });

  socket.on('user message', function(msg) {
    const cb = document.getElementById('chatMessages');
    const line = document.createElement('div');
    line.innerText = `${msg.user}: ${msg.message}`;
    cb.appendChild(line);
  });

  const mainEl = () => {
    return document.getElementsByTagName('main')[0];
  };

  const chatMessages = () => {
    const cb = document.createElement('div');
    cb.id = 'chatMessages';
    cb.style.height = '200px'
    cb.style.width = '400px'
    cb.style.background = 'rgba(0,0,0,0.2)';
    cb.style.position = 'absolute';
    cb.style.right = `0`;
    cb.style.top = `${maxTop}px`;
    mainEl().appendChild(cb);
  };

  const drawBox = (boxId, color, x, y, face) => {
    let b = document.getElementById(boxId);
    if (b) {
      mainEl().removeChild(b);
    }
    b = document.createElement('div');
    b.id = boxId;
    b.classList.add('box')
    b.style.background = `${color}`;
    b.style.left = `${x}px`;
    b.style.top = `${y}px`;
    b.innerText = face;
    mainEl().appendChild(b);
  };

  const t = setInterval(() => {
    move();
  }, redrawRate);

  setup();
};

export default Main;
