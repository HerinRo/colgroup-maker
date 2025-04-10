const boxContainer = document.getElementById('boxContainer');
const addBoxButton = document.getElementById('addBox');
const removeBoxButton = document.getElementById('removeBox');
const resetBoxButton = document.getElementById('resetBox');
const colgroupDisplay = document.getElementById('colgroupDisplay');
const copyButton = document.getElementById('copyButton');
const boxCountDisplay = document.getElementById('boxCount');
const thead = document.querySelector('thead');

let numBoxes = 1;
const minBoxes = 1;
const minWidthPercentage = 1; // Minimum width percentage

function createBox() {
  const box = document.createElement('div');
  box.classList.add('box');
  box.style.flex = `1 1 ${100 / numBoxes}%`;

  const divider = document.createElement('div');
  divider.classList.add('divider');

  divider.addEventListener('mousedown', startResizing);

  const widthDisplayElement = document.createElement('div');
  widthDisplayElement.classList.add('width-display');
  widthDisplayElement.textContent = `${Math.floor(100 / numBoxes)}%`;
  widthDisplayElement.addEventListener('dblclick', makeEditable);

  box.appendChild(divider);
  box.appendChild(widthDisplayElement);
  boxContainer.appendChild(box);
  updateBoxWidths();
}

function updateBoxWidths() {
  const boxes = document.querySelectorAll('.box');
  const totalBoxes = boxes.length;
  const widthPercentage = Math.floor(100 / totalBoxes);

  boxes.forEach((box, index) => {
    const boxWidthPercentage = (index === totalBoxes - 1)
      ? 100 - widthPercentage * (totalBoxes - 1)
      : widthPercentage;
    box.style.flex = `1 1 ${boxWidthPercentage}%`;
    const widthDisplay = box.querySelector('.width-display');
    widthDisplay.textContent = `${boxWidthPercentage}%`;
  });

  updateBoxCount();
  updateColgroupDisplay();
  updateTheadDisplay();
}

function updateBoxCount() {
  boxCountDisplay.textContent = `박스 개수: ${numBoxes}`;
}

function updateColgroupDisplay() {
  const boxes = document.querySelectorAll('.box');
  let colgroupHTML = '<table>\n  <colgroup>\n';
  let theadHTML = '  <thead>\n    <tr>\n';
  let tbodyHTML = '  <tbody>\n    <tr>\n';

  let totalWidth = 0;
  let boxWidths = [];

  boxes.forEach((box) => {
    let boxWidth = parseFloat(box.style.flex.split(' ')[2]);
    totalWidth += boxWidth;
    boxWidths.push(boxWidth);
  });

  // Adjust the widths to ensure the total is 100%
  let diff = 100 - totalWidth;
  if (Math.abs(diff) > 0.01) {  // If there's a significant difference
    let adjustment = diff / boxes.length;
    boxWidths = boxWidths.map(width => width + adjustment);
  }

  boxes.forEach((box, index) => {
    let boxWidth = boxWidths[index];
    if (boxWidth % 1 !== 0) {
      boxWidth = boxWidth.toFixed(2);
    }
    colgroupHTML += `    <col width="${boxWidth}%" />\n`;
    theadHTML += `      <th></th>\n`;
    tbodyHTML += `      <td></td>\n`;
  });

  colgroupHTML += '  </colgroup>\n\n';
  theadHTML += '    </tr>\n  </thead>\n\n';
  tbodyHTML += '    </tr>\n  </thead>\n</table>';
  colgroupDisplay.textContent = colgroupHTML + theadHTML + tbodyHTML;
}


function copyToClipboard() {
  const range = document.createRange();
  range.selectNode(colgroupDisplay);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  try {
    document.execCommand('copy');
    alert('Copied to clipboard');
  } catch (err) {
    alert('Failed to copy');
  }
  window.getSelection().removeAllRanges();
}

addBoxButton.addEventListener('click', () => {
  numBoxes += 1;
  createBox();
});

removeBoxButton.addEventListener('click', () => {
  if (numBoxes > minBoxes) {
    boxContainer.removeChild(boxContainer.lastElementChild);
    numBoxes -= 1;
    updateBoxWidths();
  }
});

resetBoxButton.addEventListener('click', () => {
  while (boxContainer.firstChild) {
    boxContainer.removeChild(boxContainer.firstChild);
  }
  numBoxes = 1;
  createBox();
});

copyButton.addEventListener('click', copyToClipboard);

function startResizing(e) {
  e.preventDefault();
  const startX = e.clientX;
  const box = e.target.parentElement;
  const nextBox = box.nextElementSibling;

  const boxInitialWidth = box.offsetWidth;
  const nextBoxInitialWidth = nextBox ? nextBox.offsetWidth : 0;

  function resizeHandler(e) {
    const dx = e.clientX - startX;
    const totalWidth = boxContainer.offsetWidth;
    let newBoxWidth = boxInitialWidth + dx;
    let newNextBoxWidth = nextBoxInitialWidth - dx;

    // Ensure minimum width is 1%
    if (newBoxWidth / totalWidth * 100 < minWidthPercentage) {
      newBoxWidth = minWidthPercentage / 100 * totalWidth;
      newNextBoxWidth = boxInitialWidth + nextBoxInitialWidth - newBoxWidth;
    } else if (newNextBoxWidth / totalWidth * 100 < minWidthPercentage) {
      newNextBoxWidth = minWidthPercentage / 100 * totalWidth;
      newBoxWidth = boxInitialWidth + nextBoxInitialWidth - newNextBoxWidth;
    }

    const newBoxWidthPercentage = Math.floor((newBoxWidth / totalWidth) * 100);
    const newNextBoxWidthPercentage = Math.floor((newNextBoxWidth / totalWidth) * 100);

    box.style.flex = `1 1 ${newBoxWidthPercentage}%`;
    if (nextBox) {
      nextBox.style.flex = `1 1 ${newNextBoxWidthPercentage}%`;
    }

    const boxWidthDisplay = box.querySelector('.width-display');
    if (boxWidthDisplay) {
      boxWidthDisplay.textContent = `${newBoxWidthPercentage}%`;
    }

    const nextBoxWidthDisplay = nextBox.querySelector('.width-display');
    if (nextBoxWidthDisplay) {
      nextBoxWidthDisplay.textContent = `${newNextBoxWidthPercentage}%`;
    }

    updateColgroupDisplay();
    updateTheadDisplay();
  }

  function stopResizing() {
    window.removeEventListener('mousemove', resizeHandler);
    window.removeEventListener('mouseup', stopResizing);
  }

  window.addEventListener('mousemove', resizeHandler);
  window.addEventListener('mouseup', stopResizing);
}

function makeEditable(e) {
  const widthDisplay = e.target;
  widthDisplay.contentEditable = true;
  widthDisplay.classList.add('editable');
  widthDisplay.focus();

  let originalContent = widthDisplay.textContent;

  function applyWidth() {
    widthDisplay.contentEditable = false;
    widthDisplay.classList.remove('editable');
  
    let newPercentage = parseFloat(widthDisplay.textContent.replace('%', ''));
    if (isNaN(newPercentage) || newPercentage < minWidthPercentage) {
      newPercentage = minWidthPercentage;
    } else if (newPercentage > 100) {
      newPercentage == 100;
    }
  
    // Round to nearest integer
    newPercentage = Math.round(newPercentage);
  
    // Calculate total current width excluding current box
    let totalCurrentWidth = 0;
    Array.from(boxContainer.children).forEach((box, index) => {
      if (box !== widthDisplay.parentElement) {
        totalCurrentWidth += parseFloat(box.style.flex.split(' ')[2]);
      }
    });
  
    // Calculate new total width if current box width is updated
    const currentBoxWidth = parseFloat(widthDisplay.parentElement.style.flex.split(' ')[2]);
    let newTotalWidth = totalCurrentWidth + newPercentage - currentBoxWidth;
  
    // Check if new total width exceeds 100%
    if (newTotalWidth > 100) {
      // Calculate the excess width
      let excessWidth = newTotalWidth - 100;
  
      // Distribute the excess width among other boxes
      const otherBoxes = Array.from(boxContainer.children).filter(box => box !== widthDisplay.parentElement);
      const totalOtherBoxes = otherBoxes.length;
  
      otherBoxes.forEach(box => {
        let currentWidth = parseFloat(box.style.flex.split(' ')[2]);
        let reduction = Math.min(excessWidth / totalOtherBoxes, currentWidth - minWidthPercentage);
        box.style.flex = `1 1 ${currentWidth - reduction}%`;
        const widthDisplay = box.querySelector('.width-display');
        widthDisplay.textContent = `${Math.floor(currentWidth - reduction)}%`;
        excessWidth -= reduction;
      });
  
      newTotalWidth == 100; // Adjust newTotalWidth to 100 after distributing excess
    }
  
    // Update styles and display texts
    widthDisplay.parentElement.style.flex = `1 1 ${newPercentage}%`;
    widthDisplay.textContent = `${Math.floor(newPercentage)}%`;
  
    updateColgroupDisplay();
    updateTableHeader();
  }
  

  widthDisplay.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      applyWidth();
      widthDisplay.blur();
    }
  });

}

createBox();
