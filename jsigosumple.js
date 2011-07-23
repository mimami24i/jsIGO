/**
 * @fileoverview JavaScript囲碁ライブラリmigolb.jsのサンプル。
 *  jquery1.4.4以降, migolb.js を前提とする。
 * @author mimami24im@gmail.com
 */
 
/**
 * @namespace
 */
var mijoseki = {};

(function($) {
/* 定数 */
mijoseki.con = {
  id: { // id名
    cv: 'cv1', // Canvas
    clbtn: 'clbtn', // クリアボタン
    rowbtn: 'rowbtn', // 盤変更ボタン
    rowsel: 'rowsel', // 何路盤か指定select
    ldmsg: 'ldmsg'  // ロード中メッセージ表示div
  }
};

/* グローバル変数 */
mijoseki.act = null; // アクションインスタンス

/**
 * アクションクラス
 * @param {HTMLElement} canvas 表示先HTMLCanvasElement
 * @param {number} cvx ブラウザ上のCanvas左上x座標
 * @param {number} cvy ブラウザ上のCanvas左上y座標
 * @private
 * @constructor
 */
mijoseki.Action_ = function(canvas, cvx, cvy) {
  /**
   * 碁盤クラスインスタンス
   * @type {migolib.Goban}
   */
  this.goban = new migolib.Goban(canvas);;
  /**
   * ブラウザ上のCanvas左上x座標
   * 整数を設定することを推奨
   * @type {number}
   */
  this.cvx = cvx;
  /**
   * ブラウザ上のCanvas左上y座標
   * 整数を設定することを推奨
   * @type {number}
   */
  this.cvy = cvy;
  /**
   * 置く石の色。migolib.con.eyest の値をセット。
   * @type {string}
   * @private
   */
  this.sttype_ = migolib.con.eyest.b;
  /**
   * マウスポインタが指す目のX軸方向index。一番左の目が0
   * @type {number}
   */
  this.xidx = 0;
  /**
   * マウスポインタが指す目のY軸方向index。一番上の目が0
   * @type {number}
   */
  this.yidx = 0;
  /**
   * 前回描画時のxidx
   * @type {number}
   * @private
   */
  this.xidxbk_ = 0;
  /**
   * 前回描画時のyidx
   * @type {number}
   * @private
   */
  this.yidxbk_ = 0;
  /**
   * 描画フラグ。trueならdrawする。
   * @type {boolean}
   * @private
   */
  this.drawflg_ = false;
  /**
   * 1秒あたりのフレーム数
   * @type {number}
   * @private
   */
  this.fps_ = 12;
  /**
   * フレーム表示間隔(ミリ秒)
   * @type {number}
   */
  this.mspf = 1000 / this.fps_;;
  /**
   * タイマー用ID
   */
  this.timeoutID = null;
};
/**
 * 碁盤のサイズを変更して再表示
 * @param {number} rownum 何路盤か。5以上19以下の整数を設定
 */
mijoseki.Action_.prototype.chngsz = function(rownum) {
  this.goban.setrownum(rownum);
  this.goban.drawbanst();
};
/**
 * マウスポインタが指す目の情報を付加して描画
 */
mijoseki.Action_.prototype.draw = function() {
  // drawflgがfalseで、xidx, yidxに変化が無ければ描画しない
  if (!this.drawflg_ && this.xidx == this.xidxbk_ &&
      this.yidx == this.yidxbk_) {
    return;
  }
  this.goban.drawbanst();
  this.goban.drawTsStone(this.sttype_, this.xidx, this.yidx);
  this.xidxbk_ = this.xidx;
  this.yidxbk_ = this.yidx;
  this.drawflg_ = false;
};
/**
 * マウスポインタが指す目の情報と無関係に描画
 * @param {?boolean} clrflg 石をクリアする場合はtrue。
 */
mijoseki.Action_.prototype.drawAgain = function(clrflg) {
  if (clrflg === true) {
    this.goban.eyeArrClr();
  }
  this.goban.drawbanst();
};
/**
 * 石を置く
 * @param {number} cx Canvas上X座標(px)
 * @param {number} cy Canvas上Y座標(px)
 */
mijoseki.Action_.prototype.putstone = function(cx, cy) {
  // 目のindex取得
  var eyeidx = this.goban.getEyeIdx(cx, cy);
  this.xidx = eyeidx[0];
  this.yidx = eyeidx[1];
  // 石を置く
  var rtn = this.goban.putstone(this.sttype_, eyeidx[0], eyeidx[1]);
  if (rtn == null) {
    this.drawflg_ = true;
    if (this.sttype_ == migolib.con.eyest.b) {
      this.sttype_ = migolib.con.eyest.w;
    } else {
      this.sttype_ = migolib.con.eyest.b;
    }
  } else if (rtn != migolib.con.msg.sthere) {
    window.alert('そこには石を置けません');
  }
};

/**
 * Canvasにイベント付与
 * @private
 */
mijoseki.bindEvt_ = function() {
  var $cv = $('#' + mijoseki.con.id.cv);
  $cv.mousedown(mijoseki.cvmsDown_);
  $cv.mousemove(mijoseki.cvmsMove_);
  $cv.mouseenter(mijoseki.cvmsEnter_);
  $cv.mouseleave(mijoseki.cvmsLv_);
};

/**
 * Canvasからイベント削除
 * @private
 */
mijoseki.unbindEvt_ = function() {
  var $cv = $('#' + mijoseki.con.id.cv);
  $cv.unbind('mousedown', mijoseki.cvmsDown_);
  $cv.unbind('mousemove', mijoseki.cvmsMove_);
  $cv.unbind('mouseenter', mijoseki.cvmsEnter_);
  $cv.unbind('mouseleave', mijoseki.cvmsLv_);
};

/**
 * Canvasでmousedown時に行われる処理
 * @private
 */
mijoseki.cvmsDown_ = function(evt) {
  // ポインタ座標をCanvas座標へ変換
  var cx = ~~(evt.pageX - mijoseki.act.cvx);
  var cy = ~~(evt.pageY - mijoseki.act.cvy);
  // 石を置く
  mijoseki.act.putstone(cx, cy);
};
/**
 * Canvasでmousemove時に行われる処理
 * @private
 */
mijoseki.cvmsMove_ = function(evt) {
  // ポインタ座標をCanvas座標へ変換
  var cx = ~~(evt.pageX - mijoseki.act.cvx);
  var cy = ~~(evt.pageY - mijoseki.act.cvy);
  // 目のindex取得
  var eyeidx = mijoseki.act.goban.getEyeIdx(cx, cy);
  mijoseki.act.xidx = eyeidx[0];
  mijoseki.act.yidx = eyeidx[1];
};
/**
 * Canvasでmouseenter時に行われる処理
 * @private
 */
mijoseki.cvmsEnter_ = function() {
  // メインループ開始
  if (!mijoseki.act.timeoutID) {
    mijoseki.act.timeoutID = window.setInterval(function() {
          mijoseki.act.draw();
        }, mijoseki.act.mspf);
  }
};
/**
 * Canvasでmouseleave時に行われる処理
 * @private
 */
mijoseki.cvmsLv_ = function() {
  // メインループ停止
  if (mijoseki.act.timeoutID) {
    window.clearInterval(mijoseki.act.timeoutID);
    mijoseki.act.timeoutID = null;
  }
  // 再描画
  mijoseki.act.drawAgain(false);
};

/**
 * 碁盤のサイズを変更する
 * @private
 */
mijoseki.banchg_ = function() {
  var banrow =  parseInt($('#' + mijoseki.con.id.rowsel +
    ' option:selected').val(), 10);
  mijoseki.act.chngsz(banrow);
};

/**
 * 碁盤をクリアする
 * @private
 */
mijoseki.banclear_ = function() {
  mijoseki.act.drawAgain(true);
};


$(window).load(function() {
  // HTMLCanvasElementを取得
  var canvas = document.getElementById(mijoseki.con.id.cv);
  if ( ! canvas || ! canvas.getContext ) {
   return false;
  }

  // アクションインスタンス作成
  var cvoffset = $('#' + mijoseki.con.id.cv).offset();
  mijoseki.act = new mijoseki.Action_(canvas, cvoffset.left, cvoffset.top);
  mijoseki.act.chngsz(19);

  // ロード中メッセージ削除
  $('#' + mijoseki.con.id.ldmsg).remove(); 

  // メインループ開始
  mijoseki.cvmsEnter_();

  // イベント付与
  mijoseki.bindEvt_();
  $('#' + mijoseki.con.id.clbtn).click(mijoseki.banclear_);
  $('#' + mijoseki.con.id.rowbtn).click(mijoseki.banchg_);
});

})(jQuery);

