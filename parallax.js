/*!
 * parallax.js v0.1 (http://pixelcog.github.io/parallax.js/)
 * Copyright (c) 2014 PixelCog, Inc.
 * Licensed under MIT (https://github.com/pixelcog/parallax.js/blob/master/LICENSE)
 */

;(function ( $, window, document, undefined ) {

  // Parallax Constructor Definition

  var $body = $('body');

  function Parallax(element, options) {
    this.$element  = $(element).is('body') ? $(window) : $(element);
    this.scrollTop = this.$element.scrollTop();
    this.scrollWin = this.$element.height();
    this.options   = $.extend({}, Parallax.defaults, options);
    this.selector  = this.options.parallaxTarget || this.options.target || '';
    this.sliders   = [];
    this.busy      = false;
    this.fresh     = false;

    var self = this;

    $(document).ready(function(){
      self.$element.on('scroll.px.parallax', function(){
        self.scrollTop = self.$element.scrollTop();
        self.requestRender();
      });

      $(window).on('resize.px.parallax', function(){
        self.scrollWin = self.$element.height();
        self.fresh = false;
        self.requestRender();
      });

      self.reload();
    });
  };

  Parallax.defaults = {
    'target': null,
    'speed': 0.2
  }

  Parallax.prototype.reload = function() {
    var self = this;

    $body
      .find(this.selector)
      .filter(':visible')
      .each(function() {
        var slider = {};

        slider.$holder = $(this);
        slider.$image  = slider.$holder.find('img').first();
        slider.speed   = self.options.speed;

        var data = slider.$image.data();

        slider.$image.one('load', function() {
          if (data.naturalWidth && data.naturalHeight) {
            slider.imageRatio = data.naturalWidth / data.naturalHeight;
          } else {
            if (this.naturalWidth == undefined || this.naturalHeight == undefined) {
              var tmp = new Image();
              tmp.src = this.src;
              this.naturalWidth  = tmp.width;
              this.naturalHeight = tmp.height;
            }
            slider.imageRatio = this.naturalWidth / this.naturalHeight;
          }

          self.sliders.push(slider);
          self.fresh = false;
          self.requestRender();
        });

        if (data.naturalWidth && data.naturalHeight || slider.image[0].complete) {
          slider.$image.trigger('load');
        }
      });
  };

  Parallax.prototype.refresh = function() {
    console.log('refreshing');
    var screenHeight = $(window).height();
    var i, slider, holderWidth, holderHeight, imageHeightMin;

    for (i = 0; i < this.sliders.length; ++i) {
      slider = this.sliders[i];
      slider.holderWidth = slider.$holder.width();
      slider.holderHeight = slider.$holder.height();
      slider.holderOffset = slider.$holder.offset().top;
      slider.holderBottom = slider.holderOffset + slider.holderHeight;
      imageHeightMin = Math.round(
        screenHeight - (screenHeight - slider.holderHeight) * slider.speed
      );

      if (imageHeightMin * slider.imageRatio >= slider.holderWidth) {
        slider.imageWidth  = Math.round(imageHeightMin * slider.imageRatio);
        slider.imageHeight = imageHeightMin;
        slider.offsetX     = Math.round((slider.holderWidth - slider.imageWidth) / 2);
        slider.offsetBaseY = 0;
      } else {
        slider.imageWidth  = slider.holderWidth;
        slider.imageHeight = Math.round(slider.holderWidth / slider.imageRatio);
        slider.offsetX     = 0;
        slider.offsetBaseY = Math.round((imageHeightMin - slider.imageHeight) / 2);
      }
    }

    for (i = 0; i < this.sliders.length; ++i) {
/*
      this.sliders[i].$holder.css({
        position: 'relative'
      });
      this.sliders[i].$image.css({
        position: 'absolute',
        width:  slider.imageWidth,
        height: slider.imageHeight,
        left:   slider.offsetX,
        top:    slider.offsetBaseY
      });
*/
      this.sliders[i].$image[0].style.cssText =
        '-webkit-transform: translate3d(' + slider.offsetX + 'px, ' + slider.offsetBaseY + 'px, 0px);' +
        'width:' + slider.imageWidth + 'px;' +
        'height:' + slider.imageHeight + 'px;'
      ;
    }

    this.fresh = true;
  };

  Parallax.prototype.render = function() {
    this.fresh || this.refresh();

    var screenTop = this.scrollTop;
    var screenBottom = this.scrollTop + this.scrollWin;
    var i, slider, base;

    for (i = 0; i < this.sliders.length; ++i) {
      slider = this.sliders[i];
/*
      slider.$image.css('top', slider.offsetY);
*/
      if (slider.holderBottom > screenTop && slider.holderOffset < screenBottom) {
        base = this.scrollTop - slider.holderOffset;
        slider.offsetY = Math.round(base - base * slider.speed) + slider.offsetBaseY;
        slider.$image[0].style.cssText =
          '-webkit-transform: translate3d(' + slider.offsetX + 'px, ' + slider.offsetY + 'px, 0px);' +
          'width:' + slider.imageWidth + 'px;' +
          'height:' + slider.imageHeight + 'px;'
        ;
      }
    }
  };

  Parallax.prototype.requestRender = function() {
    var self = this;

    if (!this.busy) {
      this.busy = true;
      window.requestAnimationFrame(function() {
        self.render();
        self.busy = false;
      });
    }
  };


  // Parallax Plugin Definition

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this);
      var data    = $this.data('px.parallax');
      var options = typeof option == 'object' && option;

      if (!data) $this.data('px.parallax', (data = new Parallax(this, options)));
      if (typeof option == 'string') data[option]();
    })
  };

  var old = $.fn.parallax;

  $.fn.parallax             = Plugin;
  $.fn.parallax.Constructor = Parallax;


  // Parallax No Conflict

  $.fn.parallax.noConflict = function () {
    $.fn.parallax = old;
    return this;
  };


  // Parallax Data-API

  $(window).on('load.px.parallax.data-api', function () {
    $('[data-parallax="scroll"]').each(function () {
      var $elm = $(this);
      Plugin.call($elm, $elm.data());
    });
  });


  // Polyfill for requestAnimationFrame
  // via: https://gist.github.com/paulirish/1579671

  (function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                 || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
      window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() { callback(currTime + timeToCall); },
          timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };

    if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
      };
  }());

}(jQuery, window, document));