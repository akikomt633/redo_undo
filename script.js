var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

var stack = new Array(); // 現時点でのデータを保存
var undoStack = new Array(); // undo可能のデータを保存
var redoStack = new Array(); // redo可能のデータを保存
var selected = false; // 現在円が選択されているか
var selectedX ; // 現在選択されている円のx座標
var selectedY ; // 現在選択されている円のy座標
var selectedI ; // 現在選択されている円のstack配列の添え字
var beforemovingX ; //ドラッグ前の円のx座標
var beforemovingY ; //ドラッグ前の円のy座標
var dragging = false; // 特定の円が選択状態になっているか（ドラッグできるか）
var relX; // 選ばれた円の中心からのマウスが押されたｘ座標の相対位置
var relY; // 選ばれた円の中心からのマウスが押されたｙ座標の相対位置

// -----------------ラジオボタン--------------------

// ラジオボタンの値を取得
var radio_value = "draw"
var input_radio = document.querySelectorAll("input[name=radio]");
for(var element of input_radio) {
    element.addEventListener('change',function(){
        if( this.checked ) { // ラジオボタンがチェックされた
            selectedCancel(stack); // 選択を解除する関数
            radio_value = this.value; // ラジオボタンの値を取得
        }
    });
}

// -----------------マウス--------------------

function onClick (e) { // クリックされた
    // クリックされた座標を取得
    var x = y = 0;
    x = e.clientX - canvas.offsetLeft;
    y = e.clientY - canvas.offsetTop;

    if (radio_value === "draw") { // 「作成ボタン」が選択されている時、

        // クリックされた座標に円を追加し、座標をstackとUndoStackに保存
        stack.push({horizontal: x,vertical: y});
        stackUndoStack(stack);
        drawCircle(x, y)
        console.log("追加");
        console.log(stack);
        console.log(undoStack);
        console.log(redoStack);

        // 空のundoStackにデータが入ったら、「元に戻す」ボタンを活性にする
        if (undoStack.length === 1 ) {
            document.getElementById("undo").disabled = false;
        }
    }    
}

function onDown(e) { // マウスが押された
    if  (radio_value === "select") {
        // マウスが押された座標を取得
        var x = y = 0;
        x = e.clientX - canvas.offsetLeft;
        y = e.clientY - canvas.offsetTop;

        selectedCancel(stack); // 現在の選択を解除する

        // 円が選択されたら矩形で囲む
        for(var i = stack.length - 1; i >= 0; i--) {
            var h = stack[i].horizontal;
            var v = stack[i].vertical;
            // もし選択された場所に円があったら、
            if (Math.sqrt(Math.pow((x - h), 2) + Math.pow((y - v), 2)) <= 30) {   
                selected = true; // 選択されているに変更
                selectedX = h; // 選択された円の中心のx座標を保存
                selectedY = v; // 選択された円の中心のy座標を保存
                selectedI = i; // 選択された円のstack配列の添え字を保存

                dragging = true; // ドラッグ可能

                // 選ばれた円の中心からクリックされている点の相対位置を取得
                relX = selectedX - x;
                relY = selectedY - y;

                // 移動前の円の位置を保存
                beforemovingX = selectedX;
                beforemovingY = selectedY;

                drawRect(selectedX, selectedY); // 矩形を描く関数

                break;
            }
        }
    }
}

function onMove(e) { // マウスがドラッグされた
    
    // 移動しているマウスの座標
    var x = y = 0;
    x = e.clientX - canvas.offsetLeft;
    y = e.clientY - canvas.offsetTop;

    if (dragging) {
        // ドラッグされている円の座標
        selectedX = x + relX;
        selectedY = y + relY;

        context.clearRect(0, 0, canvas.width, canvas.height);
        for(var i = 0; i < stack.length; i++) {

            // 選ばれていない円を描く
            if (i != selectedI) {
                var j = stack[i].horizontal;
                var k = stack[i].vertical;
                drawCircle(j, k);
            } else {
                // 選ばれた円を描く
                drawCircle(selectedX, selectedY);
                drawRect(selectedX, selectedY);
                stack[i] = {horizontal: selectedX, vertical: selectedY};                
            }
        }        
    }
}

function onUp(e) { // マウスがドラッグされた
    
    if (dragging) {
        // 移動していれば移動先のデータを保存
        if (selectedX != beforemovingX || selectedY != beforemovingY) {
            stackUndoStack(stack);
            console.log("移動");
            console.log(stack);
            console.log(undoStack);
            console.log(redoStack);
        }
    }

    dragging = false; // ドラッグ終了
}

// -----------------ボタン--------------------

// 削除ボタンが押された
function deleteButtonClick() {
    if (selected) {
        stack.splice(selectedI, 1);
        stackUndoStack(stack);
        console.log("削除");
        console.log(stack);
        console.log(undoStack);
        console.log(redoStack);
        redrawAll(stack);
        selected = false;
    }
}

// 「元に戻す」ボタンが押された
function undoButtonClick() {

    // undoStack配列の最後のデータをredoStack配列の最後に移動する
    redoStack.push(undoStack.pop());

    // undoStackのデータが残り1つならstackを空にし、それ以外ならundoStackの1つ前のデータをstackに入れる
    if (undoStack.length === 0) {
        stack.splice(0, 1);
    } else {
        replaceStack(undoStack[undoStack.length-1]);
    }
    
    // 画面を表示
    redrawAll(stack);
    console.log("元に戻すボタンが押された");
    console.log(stack);
    console.log(undoStack);
    console.log(redoStack);

    // undoStackが空になったら、「元に戻す」ボタンを非活性にする
    if (undoStack.length === 0) {
        document.getElementById("undo").disabled = true;
    }

    // 空のredoStackにデータが入ったら、「やり直し」ボタンを活性にする
    if (redoStack.length === 1 ) {
        document.getElementById("redo").disabled = false;
    }
}

// やり直しボタンが押された
function redoButtonClick() {

    // redoStack配列の最後のデータをundoStack配列の最後に移動する
    undoStack.push(redoStack.pop());
    replaceStack(undoStack[undoStack.length-1]);    
    console.log("やり直しボタンが押された");
    console.log(stack);
    console.log(undoStack);
    console.log(redoStack);
    redrawAll(stack);

    // 空のundoStackにデータが入ったら、「元に戻す」ボタンを活性にする
    if (undoStack.length === 1) {
        document.getElementById("undo").disabled = false;
    }

    // redoStackが空になったら、「やり直し」ボタンを非活性にする
    if (redoStack.length === 0 ) {
        document.getElementById("redo").disabled = true;
    }
}

// -----------------関数--------------------

// 選択解除の関数
function selectedCancel(stack) {
    redrawAll(stack); // 選択を解除
    selected = false; // 選択されていないに変更
}

// 保存された座標のすべての円を再描画する関数
function redrawAll(stack) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (undoStack.length > 0) {
        for(var i = 0; i < stack.length; i++) {
            var j = stack[i].horizontal;
            var k = stack[i].vertical;
            drawCircle(j, k);
        }
    }    
}

// 円を描く関数
function drawCircle(x, y) {
    context.beginPath();
    context.arc(x, y, 30, 0, Math.PI * 2, true);
    context.fillStyle = '#FFD5EC';
    context.fill();
    context.strokeStyle = 'red';
    context.lineWidth = 2;
    context.stroke();
}

// 矩形を描く関数
function drawRect(x, y) {
    context.strokeStyle = 'aqua';
    context.strokeRect(x - 32, y - 32, 64, 64)                
    context.lineWidth = 2;
}

// undoStackに現在のデータstackを保存する関数
function stackUndoStack(stack) {
    var n = undoStack.length;
    undoStack[n] = new Array();
    for(var i = 0; i < stack.length; i++) {
        var j = stack[i].horizontal;
        var k = stack[i].vertical;
        undoStack[n].push({horizontal: j,vertical: k});
    }
    // redoStackを初期化
    redoStack = [];

    // 「やり直し」ボタンを非活性にする
    document.getElementById("redo").disabled = true;
}

// 現在の画面データをstackに入れる関数
function replaceStack(array) {
    // stackの中身を初期化
    stack = [];    
    if (undoStack.length > 0) {
        for(var i = 0; i < array.length; i++) {
            var j = array[i].horizontal;
            var k = array[i].vertical;
            stack.push({horizontal: j,vertical: k});         
        }
    }    
}

// -----------------イベントリスナー--------------------

canvas.addEventListener('click', onClick, false);
canvas.addEventListener('mousedown', onDown, false);
canvas.addEventListener('mousemove', onMove, false);
canvas.addEventListener('mouseup', onUp, false);
