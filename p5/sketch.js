let video;
let handPose;
let hands = [];
let painting;
let px = 0;
let py = 0;
let currentColor;
let lastColorChangeTime = 0;
let drawMode = false; // 그리기 활성화 상태
let buttonPressed = false;
let reactions = ["🙋 손들기", "😄 웃음", "👍 좋아요", "😴 졸려요"];
let selectedReaction = "";
let lastReactionTime = 0;
let reactionButtons = []; // 버튼 위치 정보

let colors = [
  { name: 'Red', c: [255, 0, 0] },
  { name: 'Green', c: [0, 255, 0] },
  { name: 'Blue', c: [0, 0, 255] },
  { name: 'Yellow', c: [255, 255, 0] },
  { name: 'White', c: [255, 255, 255] }
];

const drawButton = { x: 270, y: 420, w: 100, h: 50 };

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(640, 480);
  painting = createGraphics(640, 480);
  painting.clear();

  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  handPose.detectStart(video, gotHands);

  currentColor = color(255, 255, 0); // 초기 펜 색
  // 리액션 버튼 위치 정의 (오른쪽 위에서 아래로)
  for (let i = 0; i < reactions.length; i++) {
    reactionButtons.push({
      x: 560,
      y: 10 + i * 60,
      w: 70,
      h: 50,
      label: reactions[i]
    });
  }

}

function draw() {
  image(video, 0, 0);
  image(painting, 0, 0);

  drawColorButtons();
  drawDrawButton();
  drawReactionButtons(); // ← 리액션 버튼은 항상 그림

  if (hands.length > 0) {
    let hand = hands[0];
    let index = hand.index_finger_tip;
    let thumb = hand.thumb_tip;
    let wrist = hand.wrist;

    let x = (index.x + thumb.x) * 0.5;
    let y = (index.y + thumb.y) * 0.5;

    // 🥊 주먹 감지
    let isFist = ['index_finger_tip', 'middle_finger_tip', 'ring_finger_tip', 'pinky_finger_tip']
      .every(finger => dist(hand[finger].x, hand[finger].y, wrist.x, wrist.y) < 50);

    if (isFist) {
      painting.clear();
    } else {
      checkColorSelection(index.x, index.y);
      checkDrawButton(index.x, index.y);
      checkReaction(index.x, index.y); // ✅ index 존재하는 블록 안에서만 호출

      if (drawMode) {
        let d = dist(index.x, index.y, thumb.x, thumb.y);
        if (d < 20) {
          painting.stroke(currentColor);
          painting.strokeWeight(8);
          painting.line(px, py, x, y);
        }
      }

      px = x;
      py = y;
    }
  }

  displayReaction(); // 텍스트는 항상 표시 가능
}


// 🎨 색상 버튼
function drawColorButtons() {
  for (let i = 0; i < colors.length; i++) {
    let bx = i * 60 + 10;
    let by = 10;
    let bw = 50;
    let bh = 50;

    fill(colors[i].c);
    noStroke();
    rect(bx, by, bw, bh);

    if (currentColor.toString() === color(...colors[i].c).toString()) {
      stroke(0);
      strokeWeight(4);
      noFill();
      rect(bx - 2, by - 2, bw + 4, bh + 4);
    }
  }
}

// 🎯 색상 버튼 선택
function checkColorSelection(x, y) {
  for (let i = 0; i < colors.length; i++) {
    let bx = i * 60 + 10;
    let by = 10;
    let bw = 50;
    let bh = 50;

    if (x > bx && x < bx + bw && y > by && y < by + bh && millis() - lastColorChangeTime > 1000) {
      currentColor = color(...colors[i].c);
      lastColorChangeTime = millis();
    }
  }
}

// 🖌️ 그리기 버튼 그리기
function drawDrawButton() {
  fill(drawMode ? [100, 200, 100] : [200, 200, 200]);
  stroke(0);
  rect(drawButton.x, drawButton.y, drawButton.w, drawButton.h, 10);
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(16);
  text("Draw", drawButton.x + drawButton.w / 2, drawButton.y + drawButton.h / 2);
}

// 🖐️ 손가락이 그리기 버튼 위에 있는지 확인
function checkDrawButton(x, y) {
  let overButton =
    x > drawButton.x &&
    x < drawButton.x + drawButton.w &&
    y > drawButton.y &&
    y < drawButton.y + drawButton.h;

  if (overButton && !buttonPressed) {
    drawMode = !drawMode; // 토글
    buttonPressed = true; // 한 번만 반응하도록
  } else if (!overButton) {
    buttonPressed = false; // 손가락이 버튼에서 나갔을 때 다시 활성화 가능
  }
}
function drawReactionButtons() {
  for (let btn of reactionButtons) {
    fill(255);
    stroke(0);
    rect(btn.x, btn.y, btn.w, btn.h, 8);

    fill(0);
    noStroke();
    textSize(14);
    textAlign(CENTER, CENTER);
    text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }
}
function checkReaction(x, y) {
  for (let i = 0; i < reactionButtons.length; i++) {
    let btn = reactionButtons[i];
    let over =
      x > btn.x && x < btn.x + btn.w &&
      y > btn.y && y < btn.y + btn.h;

    if (over && millis() - lastReactionTime > 1500) {
      selectedReaction = btn.label;
      lastReactionTime = millis();
    }
  }
}
function displayReaction() {
  if (selectedReaction !== "" && millis() - lastReactionTime < 1500) {
    fill(0, 150); // 반투명 배경
    noStroke();
    rect(200, 200, 240, 60, 12);

    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text(selectedReaction, 320, 230);
  }
}

