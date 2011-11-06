/**
 * @fileoverview 囲碁ライブラリ
 * @author mimami24im@gmail.com
 */
 
/**
 * @namespace
 */
var migolib = {};

/* 定数 */
migolib.con = {
  PI2: Math.PI * 2, // 2π
  eyest: { // 目の状態
    b: 'B', // 黒石あり
    w: 'W', // 白石あり
    e: 'E'  // 石無し
  },
  col: {  // 色
    ind: '#000033', // 藍
    red: '#FF0000',  // 赤
    blue: '#0000FF',  // 青
    grn: '#1ab01a',  // 青
    b: '#000000', // 黒
    w: '#FAFAFA'  // 白
  },
  msg: {  // メッセージ
    sthere: 'There is a stone here.',
    cntput: 'You cannot put a stone here.'
  }
};

/**
 * 碁盤の目オブジェクト。x: x座標(pixel), y: y座標(pixel),
 *  st: 目の状態。migolib.con.eyest の値をセット
 * @typedef {{x: number, y: number, st: string}}
 */
migolib.Goeye;

/**
 * 碁盤クラス
 * @param {HTMLElement} cvs 表示先HTMLCanvasElement
 * @constructor
 */
migolib.Goban = function(cvs) {
  /**
   * canvas 2d context
   * @type {?CanvasRenderingContext2D}
   * @private
   */
  this.context_ = null;
  if (cvs.getContext) {
    this.context_ = cvs.getContext('2d');
  }
  /**
   * canvasの幅(pixel)
   * @type {number}
   * @private
   */
  this.cvwidth_ = ~~cvs.width;
  /**
   * canvasの高さ(pixel)
   * @type {number}
   * @private
   */
  this.cvheight_ = ~~cvs.height;
  /**
   * 何路盤か
   * @type {number}
   * @private
   */
  this.rownum_ = 19;
  /**
   * 碁盤の線の太さ(px)
   * @type {number}
   * @private
   */
  this.banlw_ = 1;
  /**
   * 碁盤の星の半径(px)
   * @type {number}
   * @private
   */
  this.starR_ = 3;
  /**
   * 碁盤のマージン(px)
   * @type {number}
   * @private
   */
  this.banmarg_ = 3;
  /**
   * 座標表示用余白(px)。マージンに追加される値
   * @type {number}
   * @private
   */
  this.coormarg_ = 17;
  /**
   * 碁盤の目の間隔(px)
   * @type {number}
   * @private
   */
  this.eyesep_ = 0;
  /**
   * 碁盤の目の間隔/2(px)
   * @type {number}
   * @private
   */
  this.eyesephf_ = 0;
  /**
   * 石の半径(px)
   * @type {number}
   * @private
   */
  this.stonR_ = 0;
  /**
   * 石の線の太さ(px)
   * @type {number}
   * @private
   */
  this.stonLw_ = 1;
  /**
   * 最新着手表示円の半径(px)
   * @type {number}
   * @private
   */
  this.lsmoveR_ = 0;
  /**
   * 候補手の線の太さ(px)
   * @type {number}
   * @private
   */
  this.candLw_ = 2;
  /**
   * 候補手表示円の半径(px)
   * @type {number}
   * @private
   */
  this.candR_ = 0;
  /**
   * 碁盤の目のx座標配列。一番左の目がthis.xArr_[0]
   * @type {Array.<number>}
   * @private
   */
  this.xArr_ = [];
  /**
   * 碁盤の目のy座標配列。一番上の目がthis.yArr_[0]
   * @type {Array.<number>}
   * @private
   */
  this.yArr_ = [];
  /**
   * 碁盤の星中心座標配列。this.stArr_[i][0] :x座標, this.stArr_[i][1] :y座標
   * @type {Array.<Array.<number>>}
   * @private
   */
  this.stArr_ = [];
  /**
   * 碁盤の目情報配列。this.eyeArr_[ix][iy]
   * ix:一番左の目が0 :iy 一番上の目が0
   * @type {Array.<Array.<migolib.Goeye>>}
   * @private
   */
  this.eyeArr_ = [];
  /**
   * 最新着手座標。
   * this.lsmove[0]: x座標index。一番左の目が0
   * this.lsmove[1]: y座標index。一番上の目が0
   * @type {?Array.<number>}
   */
  this.lsmove = null;
  /**
   * 盤面中央座標。
   * this.centpos[0]: x座標(px), this.centpos[1]: y座標(px)
   * @type {Array.<number>}
   */
  this.centpos = [~~(this.cvwidth_ / 2), ~~(this.cvheight_ / 2)];
  /**
   * 盤面中央に表示する文字列。10文字以下とする
   * @type {?string}
   */
  this.dispstr = null;
  /**
   * 盤面中央に表示する文字列のフォントサイズ
   * @type {number}
   * @private
   */
  this.dispfontsz_ = (this.cvwidth_) ? ~~(this.cvwidth_ / 10) : 10;
  /**
   * 盤面中央に表示する文字列のフォント
   * @type {string}
   * @private
   */
  this.dispfont_ = 'bold ' + this.dispfontsz_ +
      "px 'Arial', 'Tahoma', 'sans-serif'";
  /**
   * 盤面中央に表示する文字列の色
   * @type {string}
   */
  this.dispcol_ = migolib.con.col.ind;

  // フォント情報設定
  if (this.context_) {
    this.context_.textAlign = 'center';
    this.context_.textBaseline = 'middle';
    this.context_.font = this.dispfont_;
  }
  
  /**
   * 石が囲まれているかチェック済情報配列。
   * チェック済ならtrue。それ以外の場合はfalse。
   * this.eyeArr_[ix][iy] ix:一番左の目が0 :iy 一番上の目が0
   * @type {Array.<Array.<boolean>>}
   * @private
   */
  this.srdChkArr_ = [];
  /**
   * 手数
   * @type {number}
   */
  this.movenum = 1;
  /**
   * コウ判定情報
   * @type {{konum: number, kox: number, koy: number}}
   * @private
   */
  this.koinfo_ = {konum: -1, kox: -1, koy: -1};
};
/**
 * 何路盤かセット
 * @param {number} inrownum 何路盤か。5以上19以下の整数を設定
 * @param {boolean=} showcoord 座標表示用余白をマージンに付加する場合はtrue
 * @return {?string} エラーメッセージ。正常の場合はnull
 */
migolib.Goban.prototype.setrownum = function(inrownum, showcoord) {
  var rownum = ~~inrownum;
  if (rownum < 5 || rownum > 19) {
    return 'rownum: ' + inrownum + ' must be between 5 and 19.';
  }

  var coormarg = 0; // 座標表示用余白
  if (showcoord === true) {
    coormarg = this.coormarg_;
  }

  var sepx = ~~((this.cvwidth_ - this.banmarg_ * 2 - coormarg) / rownum);
  if (sepx - this.banlw_ < 5) {
    return 'canvas width is too narrow.';
  }
  var sepy = ~~((this.cvheight_ - this.banmarg_ * 2 - coormarg) / rownum);
  if (sepy - this.banlw_ < 5) {
    return 'canvas height is too narrow.';
  }

  var sep = Math.min(sepx, sepy);
  this.eyesep_ = sep;
  this.eyesephf_ = ~~(sep / 2);
  this.rownum_ = rownum;
  this.stonR_ = ~~(sep / 2) - this.stonLw_;
  this.lsmoveR_ = ~~(this.stonR_ / 2);
  this.candR_ = ~~(this.stonR_ / 1.5);
  // 碁盤の目座標配列作成
  this.xArr_ = [];
  this.yArr_ = [];
  this.xArr_[0] = this.banmarg_ + coormarg + this.stonR_ + this.stonLw_;
  this.yArr_[0] = this.banmarg_ + coormarg + this.stonR_ + this.stonLw_;
  for (var i = 1; i < rownum; i++) {
    this.xArr_[i] = this.xArr_[i - 1] + sep;
    this.yArr_[i] = this.yArr_[i - 1] + sep;
  }
  // 星座標配列作成
  this.stArr_ = [];
  var xalen = this.xArr_.length, yalen = this.yArr_.length;
  if (xalen % 2 == 1 && yalen % 2 == 1) {
    var arr = [];
    var ixsep = ~~(xalen / 4), iysep = ~~(yalen / 4);
    if (ixsep >= 3 && iysep >= 3) {
      var ixArr = [3, ~~(xalen / 2), xalen - 4];
      var iyArr = [3, ~~(yalen / 2), yalen - 4];
      for (var ix = 0; ix < ixArr.length; ix++) {
        for (var iy = 0; iy < iyArr.length; iy++) {
          arr = [];
          arr[0] = this.xArr_[ixArr[ix]];
          arr[1] = this.yArr_[ixArr[iy]];
          this.stArr_.push(arr);
        }
      }
    } else {
      arr[0] = this.xArr_[~~(xalen / 2)];
      arr[1] = this.yArr_[~~(yalen / 2)];
      this.stArr_.push(arr);
    }
  }
  // 碁盤の目情報初期化
  this.eyeinit();
  
  return null;
};
/**
 * 碁盤の目情報、石情報、表示文字列情報初期化。
 */
migolib.Goban.prototype.eyeinit = function() {
  this.eyeArr_ = [];
  for (var ix = 0; ix < this.xArr_.length; ix++) {
    this.eyeArr_[ix] = [];
    for (var iy = 0; iy < this.yArr_.length; iy++) {
      this.eyeArr_[ix][iy] = {x: 0, y: 0, st: migolib.con.eyest.e};
      this.eyeArr_[ix][iy].x = this.xArr_[ix];
      this.eyeArr_[ix][iy].y = this.yArr_[iy];
    }
  }
  this.dispstr = null;
  this.setdispcol();
  this.lsmove = null;
  this.movenum = 1;
  this.koinfo_ = {konum: -1, kox: -1, koy: -1};
};
/**
 * canvas上の座標から、目のindexを算出する。
 * @param {number} cx Canvas上X座標(px)
 * @param {number} cy Canvas上Y座標(px)
 * @return {Array.<number>} [目のx軸方向index, 目のy軸方向index]
 */
migolib.Goban.prototype.getEyeIdx = function(cx, cy) {
  var xidx, yidx;
  var xlen = this.xArr_.length, ylen = this.yArr_.length;
  var x0 = this.xArr_[0];
  var xl = this.xArr_[xlen - 1];
  var y0 = this.yArr_[0];
  var yl = this.yArr_[ylen - 1];
  if (cx <= x0) {
    xidx = 0;
  } else if (cx > xl) {
    xidx = xlen - 1;
  } else {
    xidx = ~~((cx - x0 + this.eyesephf_) / this.eyesep_);
  }
  if (cy <= y0) {
    yidx = 0;
  } else if (cy > yl) {
    yidx = ylen - 1;
  } else {
    yidx = ~~((cy - y0 + this.eyesephf_) / this.eyesep_);
  }
  return [xidx, yidx];
};
/**
 * 碁石を置く
 * @param {string} type 黒石なら'b',白石なら'w'
 * @param {number} xidx 目のx軸方向index。一番左が0
 * @param {number} yidx 目のy軸方向index。一番上が0
 * @return {?string} エラーメッセージ。正常の場合はnull
 */
migolib.Goban.prototype.putstone = function(type, xidx, yidx) {
  if (type != migolib.con.eyest.b && type != migolib.con.eyest.w) {
    return 'type: ' + type + ' must be \'' + migolib.con.eyest.b + '\' or \'' +
        migolib.con.eyest.w + '\'';
  }
  xidx = ~~xidx;
  yidx = ~~yidx;
  if (xidx < 0 || xidx >= this.eyeArr_.length) {
    return 'xidx: ' + xidx + ' is out of range';
  }
  if (yidx < 0 || yidx >= this.eyeArr_[0].length) {
    return 'yidx: ' + yidx + ' is out of range';
  }

  if (this.eyeArr_[xidx][yidx].st != migolib.con.eyest.e) {
    return migolib.con.msg.sthere;
  }

  // コウによる着手禁止点かチェック(コウでない着手禁止点もここで判定され得る)
  if (xidx == this.koinfo_.kox && yidx == this.koinfo_.koy &&
      this.koinfo_.konum == this.movenum - 1) {
    return migolib.con.msg.cntput;
  }
  
  // 仮置き
  this.eyeArr_[xidx][yidx].st = type;
  // コウフラグ設定
  var koFlg =
      !(xidx + 1 < this.xArr_.length && 
          this.eyeArr_[xidx + 1][yidx].st == type) &&
      !(yidx + 1 < this.yArr_.length && 
          this.eyeArr_[xidx][yidx + 1].st == type) &&
      !(xidx > 0 && this.eyeArr_[xidx - 1][yidx].st == type) &&
      !(yidx > 0 && this.eyeArr_[xidx][yidx - 1].st == type);
  // 相手の石が取れるかどうか調べる
  var otype;  // 相手の石の色
  if (type == migolib.con.eyest.b) {
    otype = migolib.con.eyest.w;
  } else {
    otype = migolib.con.eyest.b;
  }
  var getstnum, getstnumR, getstnumD, getstnumL, getstnumU;
  getstnum = getstnumR = getstnumD = getstnumL = getstnumU = 0;
  getstnumR += this.getstone_(otype, xidx + 1, yidx);
  getstnumD += this.getstone_(otype, xidx, yidx + 1);
  getstnumL += this.getstone_(otype, xidx - 1, yidx);
  getstnumU += this.getstone_(otype, xidx, yidx - 1);
  getstnum = getstnumR + getstnumD + getstnumL + getstnumU;
  if (getstnum == 0) {
    // 着手禁止点判定
    this.srdChkArrClr_();
    if (this.issrd_(type, xidx, yidx)) {
      this.eyeArr_[xidx][yidx].st = migolib.con.eyest.e;
      return migolib.con.msg.cntput;
    }
  } else if (koFlg && getstnum == 1) {
    // コウの座標を設定
    this.koinfo_.konum = this.movenum;
    if (getstnumR) {
      this.koinfo_.kox = xidx + 1;
      this.koinfo_.koy = yidx;
    } else if (getstnumD) {
      this.koinfo_.kox = xidx;
      this.koinfo_.koy = yidx + 1;
    } else if (getstnumL) {
      this.koinfo_.kox = xidx - 1;
      this.koinfo_.koy = yidx;
    } else {
      this.koinfo_.kox = xidx;
      this.koinfo_.koy = yidx - 1;
    } 
  }
  this.movenum++;
  return null;
};
/**
 * 石が囲まれているかチェック済情報配列初期化
 * @private
 */
migolib.Goban.prototype.srdChkArrClr_ = function() {
  for (var ix = 0; ix < this.xArr_.length; ix++) {
    this.srdChkArr_[ix] = [];
    for (var iy = 0; iy < this.yArr_.length; iy++) {
      this.srdChkArr_[ix][iy] = false;
    }
  }
};
/**
 * 石が囲まれているかチェック
 * @param {string} type 対象の石の色。黒石なら'b',白石なら'w'
 * @param {number} xidx 石がある目のx軸方向index。一番左が0
 * @param {number} yidx 石がある目のy軸方向index。一番上が0
 * @return {boolean} 囲まれている(ダメが無い)ならtrue。それ以外の場合はfalse
 * @private
 */
migolib.Goban.prototype.issrd_ = function(type, xidx, yidx) {
  if (xidx < 0 || xidx >= this.xArr_.length || yidx < 0 ||
      yidx >= this.yArr_.length) {
    // 盤外
    return true;
  }
  if (this.srdChkArr_[xidx][yidx]) {
    // チェック済
    return true;
  }
  this.srdChkArr_[xidx][yidx] = true;
  if (this.eyeArr_[xidx][yidx].st == migolib.con.eyest.e) {
    // 空点
    return false;
  }
  if (this.eyeArr_[xidx][yidx].st == type) {
    if (!this.issrd_(type, xidx + 1, yidx)) {
      return false;
    }
    if (!this.issrd_(type, xidx, yidx + 1)) {
      return false;
    }
    if (!this.issrd_(type, xidx - 1, yidx)) {
      return false;
    }
    if (!this.issrd_(type, xidx, yidx - 1)) {
      return false;
    }
    // 四方がダメ詰まり
    return true;
  } else {
    // 相手の石がある
    return true;
  }
};
/**
 * 石を取る
 * @param {string} type 対象の石の色。黒石なら'b',白石なら'w'
 * @param {number} xidx 石がある目のx軸方向index。一番左が0
 * @param {number} yidx 石がある目のy軸方向index。一番上が0
 * @return {number} 取った石の個数
 * @private
 */
migolib.Goban.prototype.getstone_ = function(type, xidx, yidx) {
  if (xidx < 0 || xidx >= this.xArr_.length || yidx < 0 ||
      yidx >= this.yArr_.length) {
    // 盤外
    return 0;
  }
  if (this.eyeArr_[xidx][yidx].st == type) {
    // 囲まれているなら取る
    this.srdChkArrClr_();
    if (this.issrd_(type, xidx, yidx)) {
      return this.getSrdStone_(type, xidx, yidx, 0);
    }
  }
  return 0;
};
/**
 * 囲まれている石を取る
 * @param {string} type 対象の石の色。黒石なら'b',白石なら'w'
 * @param {number} xidx 石がある目のx軸方向index。一番左が0
 * @param {number} yidx 石がある目のy軸方向index。一番上が0
 * @param {number} getnum 今まで取った石の数
 * @return {number} 取った石の個数
 * @private
 */
migolib.Goban.prototype.getSrdStone_ = function(type, xidx, yidx, getnum) {
  if (this.eyeArr_[xidx][yidx].st == type) {
    this.eyeArr_[xidx][yidx].st = migolib.con.eyest.e;
    getnum++;
    if (xidx + 1 < this.xArr_.length) {
      getnum += this.getSrdStone_(type, xidx + 1, yidx, getnum);
    }
    if (yidx + 1 < this.yArr_.length) {
      getnum += this.getSrdStone_(type, xidx, yidx + 1, getnum);
    }
    if (xidx > 0) {
      getnum += this.getSrdStone_(type, xidx - 1, yidx, getnum);
    }
    if (yidx > 0) {
      getnum += this.getSrdStone_(type, xidx, yidx - 1, getnum);
    }
    return getnum;
  } else {
    return 0;
  }
};
/**
 * パスする
 */
migolib.Goban.prototype.pass = function() {
  this.movenum++;
  this.lsmove = null;
  // 黒番白番は管理していない
};
/**
 * 盤をクリアして、碁盤と碁石を描画
 */
migolib.Goban.prototype.drawbanst = function() {
  this.context_.clearRect(0, 0, this.cvwidth_, this.cvheight_);
  this.drawban_();
  this.drawstone_();
  this.drawdispstr_();
  this.drawlsmove_();
};
/**
 * 碁盤を描画
 * @private
 */
migolib.Goban.prototype.drawban_ = function() {
  var xalen = this.xArr_.length, yalen = this.yArr_.length;
  var x0 = this.xArr_[0], xl = this.xArr_[xalen - 1];
  var y0 = this.yArr_[0], yl = this.yArr_[yalen - 1];
  var ctx = this.context_;
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.lineWidth = this.banlw_;
  ctx.strokeStyle = migolib.con.col.ind;
  ctx.fillStyle  = migolib.con.col.ind;
  for (var i = 0; i < xalen; i++) {
    ctx.beginPath()
    ctx.moveTo(this.xArr_[i], y0);
    ctx.lineTo(this.xArr_[i], yl);
    ctx.closePath();
    ctx.stroke();
  }
  for (var i = 0; i < yalen; i++) {
    ctx.beginPath()
    ctx.moveTo(x0, this.yArr_[i]);
    ctx.lineTo(xl, this.yArr_[i]);
    ctx.closePath();
    ctx.stroke();
  }
  // 星を描画
  for (var i = 0; i < this.stArr_.length; i++) {
    ctx.beginPath()
    ctx.arc(this.stArr_[i][0], this.stArr_[i][1], this.starR_, 0,
      migolib.con.PI2, true);
    ctx.fill();
  }
  ctx.restore();
};
/**
 * 碁石を描画
 * @private
 */
migolib.Goban.prototype.drawstone_ = function() {
  var ctx = this.context_;
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.strokeStyle = migolib.con.col.b;
  ctx.lineWidth = this.stonLw_;
  for (var ix = 0; ix < this.eyeArr_.length; ix++) {
    for (var iy = 0; iy < this.eyeArr_[ix].length; iy++) {
      var eye = this.eyeArr_[ix][iy];
      if (eye.st == migolib.con.eyest.b) {
        ctx.fillStyle  = migolib.con.col.b;
      } else if (eye.st == migolib.con.eyest.w) {
        ctx.fillStyle  = migolib.con.col.w;
      } else {
        continue;
      }
      ctx.beginPath()
      ctx.arc(eye.x, eye.y, this.stonR_, 0, migolib.con.PI2, true);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
};
/**
 * 最新着手を描画
 * @private
 */
migolib.Goban.prototype.drawlsmove_ = function() {
  if (this.lsmove && this.lsmove.length == 2) {
    var ctx = this.context_;
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle  = migolib.con.col.red;
    var eye = this.eyeArr_[this.lsmove[0]][this.lsmove[1]];
    ctx.beginPath()
    ctx.arc(eye.x, eye.y, this.lsmoveR_, 0, migolib.con.PI2, true);
    ctx.fill();
    ctx.restore();
  }
};
/**
 * 盤面表示文字列を描画
 * @private
 */
migolib.Goban.prototype.drawdispstr_ = function() {
  if (this.dispstr) {
    var ctx = this.context_;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle  = this.dispcol_;
    ctx.fillText(this.dispstr, this.centpos[0], this.centpos[1]);
    ctx.restore();
  }
};
/**
 * 盤面表示文字列の色設定
 * @param {?string=} col CSS color。nullや値無しの場合は初期化。
 */
migolib.Goban.prototype.setdispcol = function(col) {
  if (col) {
    this.dispcol_ = col;
  } else {
    this.dispcol_ = migolib.con.col.ind;
  }
};
/**
 * 透明碁石を描画
 * @param {string} type 碁石の色。migolib.con.eyest の値をセット。
 * @param {number} xidx 目のX軸方向index。一番左の目が0
 * @param {number} yidx 目のY軸方向index。一番上の目が0
 */
migolib.Goban.prototype.drawTsStone = function(type, xidx, yidx) {
  // 既に石があるなら表示しない
  if (this.eyeArr_[xidx][yidx].st != migolib.con.eyest.e) {
    return;
  }
  var ctx = this.context_;
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = migolib.con.col.b;
  ctx.lineWidth = this.stonLw_;
  if (type == migolib.con.eyest.b) {
    ctx.fillStyle  = migolib.con.col.b;
  } else {
    ctx.fillStyle  = migolib.con.col.w;
  }
  ctx.beginPath()
  ctx.arc(this.xArr_[xidx], this.yArr_[yidx], this.stonR_, 0, migolib.con.PI2,
      true);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};
/**
 * 候補手を描画
 * @param {string} type 碁石の色。migolib.con.eyest の値をセット。
 * @param {number} xidx 目のX軸方向index。一番左の目が0
 * @param {number} yidx 目のY軸方向index。一番上の目が0
 */
migolib.Goban.prototype.drawCand = function(type, xidx, yidx) {
  var ctx = this.context_;
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = this.candLw_;
  if (type == migolib.con.eyest.b) {
    ctx.strokeStyle  = migolib.con.col.b;
  } else {
    ctx.strokeStyle  = migolib.con.col.w;
  }
  ctx.beginPath()
  ctx.arc(this.xArr_[xidx], this.yArr_[yidx], this.candR_, 0, migolib.con.PI2,
      true);
  ctx.stroke();
  ctx.restore();
};
