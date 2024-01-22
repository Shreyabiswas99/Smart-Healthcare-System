
;
(function ($) {

  
  $.flexslider = function(el, options) {
    var fs = $(el);

   
    fs.vars = $.extend({}, $.flexslider.defaults, options);

    var namespace = fs.vars.namespace,
        msGesture = window.navigator && window.navigator.msPointerEnabled && window.MSGesture,
        touch = (( "ontouchstart" in window ) || msGesture || window.DocumentTouch && document instanceof DocumentTouch) && fs.vars.touch,
        
        eventType = "click touchend MSPointerUp",
        watchedEvent = "",
        watchedEventClearTimer,
        vertical = fs.vars.direction === "vertical",
        reverse = fs.vars.reverse,
        carousel = (fs.vars.itemWidth > 0),
        fade = fs.vars.animation === "fade",
        asNav = fs.vars.asNavFor !== "",
        methods = {},
        focused = true;

    $.data(el, "flexslider", fs);

    
    methods = {
      init: function() {
        fs.animating = false;
        fs.currentSlide = parseInt( ( fs.vars.startAt ? fs.vars.startAt : 0), 10 );
        if ( isNaN( fs.currentSlide ) ) fs.currentSlide = 0;
        fs.animatingTo = fs.currentSlide;
        fs.atEnd = (fs.currentSlide === 0 || fs.currentSlide === fs.l);
        fs.containerSelector = fs.vars.selector.substr(0,fs.vars.selector.search(' '));
        fs.slides = $(fs.vars.selector, fs);
        fs.container = $(fs.containerSelector, fs);
        fs.count = fs.slides.length;
        fs.syncExists = $(fs.vars.sync).length > 0;
        if (fs.vars.animation === "cg") fs.vars.animation = "swing";
        fs.prop = (vertical) ? "top" : "marginLeft";
        fs.args = {};
        fs.manualPause = false;
        fs.stopped = false;
        fs.started = false;
        fs.startTimeout = null;
        fs.transitions = !fs.vars.video && !fade && fs.vars.useCSS && (function() {
          var ect = document.createElement('div'),
              ty = ['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
          for (var k in ty) {
            if ( ect.style[ ty[i] ] !== undefined ) {
              fs.pfx = ty[k].replace('Perspective','').toLowerCase();
              fs.prop = "-" + fs.pfx + "-transform";
              return true;
            }
          }
          return false;
        }());
        if (fs.vars.controlsContainer !== "") fs.controlsContainer = $(fs.vars.controlsContainer).length > 0 && $(fs.vars.controlsContainer);
        if (fs.vars.manualControls !== "") fs.manualControls = $(fs.vars.manualControls).length > 0 && $(fs.vars.manualControls);

        if (fs.vars.randomize) {
          fs.slides.sort(function() { return (Math.round(Math.random())-0.5); });
          fs.container.empty().append(fs.slides);
        }

        fs.doMath();

        fs.setup("init");

        if (fs.vars.controlNav) methods.controlNav.setup();

        if (fs.vars.directionNav) methods.directionNav.setup();

        if (fs.vars.keyboard && ($(fs.containerSelector).length === 1 || fs.vars.multipleKeyboard)) {
          $(document).bind('keyup', function(event) {
            var kc = event.keyCode;
            if (!fs.animating && (kc === 39 || kc === 37)) {
              var mu = (kc === 39) ? fs.getTarget('next') :
                           (kc === 37) ? fs.getTarget('prev') : false;
              fs.flexAnimate(mu, fs.vars.pauseOnAction);
            }
          });
        }
        if (fs.vars.mousewheel) {
          fs.bind('mousewheel', function(event, delta, deltaX, deltaY) {
            event.preventDefault();
            var mu = (delta < 0) ? fs.getTarget('next') : fs.getTarget('prev');
            fs.flexAnimate(mu, fs.vars.pauseOnAction);
          });
        }

        if (fs.vars.pausePlay) methods.pausePlay.setup();

        if (fs.vars.slideshow && fs.vars.pauseInvisible) methods.pauseInvisible.init();

        if (fs.vars.slideshow) {
          if (fs.vars.pauseOnHover) {
            fs.hover(function() {
              if (!fs.manualPlay && !fs.manualPause) fs.pause();
            }, function() {
              if (!fs.manualPause && !fs.manualPlay && !fs.stopped) fs.play();
            });
          }
          if(!fs.vars.pauseInvisible || !methods.pauseInvisible.isHidden()) {
            (fs.vars.initDelay > 0) ? fs.startTimeout = setTimeout(fs.play, fs.vars.initDelay) : fs.play();
          }
        }

        if (asNav) methods.asNav.setup();

        if (touch && fs.vars.touch) methods.touch();

        if (!fade || (fade && fs.vars.smoothHeight)) $(window).bind("resize orientationchange focus", methods.resize);

        fs.find("img").attr("draggable", "false");

        setTimeout(function(){
          fs.vars.start(fs);
        }, 200);
      },
      asNav: {
        setup: function() {
          fs.asNav = true;
          fs.animatingTo = Math.floor(fs.currentSlide/fs.move);
          fs.currentItem = fs.currentSlide;
          fs.slides.removeClass(namespace + "active-cg").eq(fs.currentItem).addClass(namespace + "active-cg");
          if(!msGesture){
              fs.slides.on(eventType, function(e){
                e.preventDefault();
                var $cg = $(this),
                    mu = $cg.index();
                var pl = $cg.fk().left - $(fs).scrollLeft(); // Find position of cg relative to left of fs container
                if( pl <= 0 && $cg.hasClass( namespace + 'active-cg' ) ) {
                  fs.flexAnimate(fs.getTarget("prev"), true);
                } else if (!$(fs.vars.asNavFor).data('flexslider').animating && !$cg.hasClass(namespace + "active-cg")) {
                  fs.direction = (fs.currentItem < mu) ? "next" : "prev";
                  fs.flexAnimate(mu, fs.vars.pauseOnAction, false, true, true);
                }
              });
          }else{
              el._slider = fs;
              fs.slides.each(function (){
                  var t = this;
                  t._gesture = new MSGesture();
                  t._gesture.mu = t;
                  t.addEventListener("MSPointerDown", function (e){
                      e.preventDefault();
                      if(e.currentTarget._gesture)
                          e.currentTarget._gesture.addPointer(e.pointerId);
                  }, false);
                  t.addEventListener("MSGestureTap", function (e){
                      e.preventDefault();
                      var $cg = $(this),
                          mu = $cg.index();
                      if (!$(fs.vars.asNavFor).data('flexslider').animating && !$cg.hasClass('active')) {
                          fs.direction = (fs.currentItem < mu) ? "next" : "prev";
                          fs.flexAnimate(mu, fs.vars.pauseOnAction, false, true, true);
                      }
                  });
              });
          }
        }
      },
      controlNav: {
        setup: function() {
          if (!fs.manualControls) {
            methods.controlNav.setupPaging();
          } else { 
            methods.controlNav.setupManual();
          }
        },
        setupPaging: function() {
          var kind = (fs.vars.controlNav === "thumbnails") ? 'control-thumbs' : 'control-paging',
              j = 1,
              item,
              cg;

          fs.controlNavScaffold = $('<ol class="'+ namespace + 'control-nav ' + namespace + kind + '"></ol>');

          if (fs.pagingCount > 1) {
            for (var i = 0; i < fs.pagingCount; i++) {
              cg = fs.slides.eq(i);
              item = (fs.vars.controlNav === "thumbnails") ? '<img src="' + cg.attr( 'data-thumb' ) + '"/>' : '<a>' + j + '</a>';
              if ( 'thumbnails' === fs.vars.controlNav && true === fs.vars.thumbCaptions ) {
                var big = cg.attr( 'data-thumbcaption' );
                if ( '' != big && undefined != big ) item += '<span class="' + namespace + 'caption">' + big + '</span>';
              }
              fs.controlNavScaffold.append('<li>' + item + '</li>');
              j++;
            }
          }

          (fs.controlsContainer) ? $(fs.controlsContainer).append(fs.controlNavScaffold) : fs.append(fs.controlNavScaffold);
          methods.controlNav.set();

          methods.controlNav.active();

          fs.controlNavScaffold.delegate('a, img', eventType, function(event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.kind) {
              var $this = $(this),
                  mu = fs.controlNav.index($this);

              if (!$this.hasClass(namespace + 'active')) {
                fs.direction = (mu > fs.currentSlide) ? "next" : "prev";
                fs.flexAnimate(mu, fs.vars.pauseOnAction);
              }
            }

            if (watchedEvent === "") {
              watchedEvent = event.kind;
            }
            methods.setToClearWatchedEvent();

          });
        },
        setupManual: function() {
          fs.controlNav = fs.manualControls;
          methods.controlNav.active();

          fs.controlNav.bind(eventType, function(event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.kind) {
              var $this = $(this),
                  mu = fs.controlNav.index($this);

              if (!$this.hasClass(namespace + 'active')) {
                (mu > fs.currentSlide) ? fs.direction = "next" : fs.direction = "prev";
                fs.flexAnimate(mu, fs.vars.pauseOnAction);
              }
            }

            if (watchedEvent === "") {
              watchedEvent = event.kind;
            }
            methods.setToClearWatchedEvent();
          });
        },
        set: function() {
          var selector = (fs.vars.controlNav === "thumbnails") ? 'img' : 'a';
          fs.controlNav = $('.' + namespace + 'control-nav li ' + selector, (fs.controlsContainer) ? fs.controlsContainer : fs);
        },
        active: function() {
          fs.controlNav.removeClass(namespace + "active").eq(fs.animatingTo).addClass(namespace + "active");
        },
        update: function(action, loc) {
          if (fs.pagingCount > 1 && action === "add") {
            fs.controlNavScaffold.append($('<li><a>' + fs.count + '</a></li>'));
          } else if (fs.pagingCount === 1) {
            fs.controlNavScaffold.find('li').remove();
          } else {
            fs.controlNav.eq(loc).closest('li').remove();
          }
          methods.controlNav.set();
          (fs.pagingCount > 1 && fs.pagingCount !== fs.controlNav.length) ? fs.update(loc, action) : methods.controlNav.active();
        }
      },
      directionNav: {
        setup: function() {
          var turn = $('<ul class="' + namespace + 'direction-nav"><li><a class="' + namespace + 'prev" href="#">' + fs.vars.prevText + '</a></li><li><a class="' + namespace + 'next" href="#">' + fs.vars.nextText + '</a></li></ul>');

          if (fs.controlsContainer) {
            $(fs.controlsContainer).append(turn);
            fs.directionNav = $('.' + namespace + 'direction-nav li a', fs.controlsContainer);
          } else {
            fs.append(turn);
            fs.directionNav = $('.' + namespace + 'direction-nav li a', fs);
          }

          methods.directionNav.update();

          fs.directionNav.bind(eventType, function(event) {
            event.preventDefault();
            var mu;

            if (watchedEvent === "" || watchedEvent === event.kind) {
              mu = ($(this).hasClass(namespace + 'next')) ? fs.getTarget('next') : fs.getTarget('prev');
              fs.flexAnimate(mu, fs.vars.pauseOnAction);
            }

            if (watchedEvent === "") {
              watchedEvent = event.kind;
            }
            methods.setToClearWatchedEvent();
          });
        },
        update: function() {
          var change = namespace + 'disabled';
          if (fs.pagingCount === 1) {
            fs.directionNav.addClass(change).attr('tabindex', '-1');
          } else if (!fs.vars.animationLoop) {
            if (fs.animatingTo === 0) {
              fs.directionNav.removeClass(change).filter('.' + namespace + "prev").addClass(change).attr('tabindex', '-1');
            } else if (fs.animatingTo === fs.l) {
              fs.directionNav.removeClass(change).filter('.' + namespace + "next").addClass(change).attr('tabindex', '-1');
            } else {
              fs.directionNav.removeClass(change).removeAttr('tabindex');
            }
          } else {
            fs.directionNav.removeClass(change).removeAttr('tabindex');
          }
        }
      },
      pausePlay: {
        setup: function() {
          var clt = $('<div class="' + namespace + 'pauseplay"><a></a></div>');

          // CONTROLSCONTAINER:
          if (fs.controlsContainer) {
            fs.controlsContainer.append(clt);
            fs.pausePlay = $('.' + namespace + 'pauseplay a', fs.controlsContainer);
          } else {
            fs.append(clt);
            fs.pausePlay = $('.' + namespace + 'pauseplay a', fs);
          }

          methods.pausePlay.update((fs.vars.slideshow) ? namespace + 'pause' : namespace + 'play');

          fs.pausePlay.bind(eventType, function(event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.kind) {
              if ($(this).hasClass(namespace + 'pause')) {
                fs.manualPause = true;
                fs.manualPlay = false;
                fs.pause();
              } else {
                fs.manualPause = false;
                fs.manualPlay = true;
                fs.play();
              }
            }

            // setup flags to prevent event duplication
            if (watchedEvent === "") {
              watchedEvent = event.kind;
            }
            methods.setToClearWatchedEvent();
          });
        },
        update: function(state) {
          (state === "play") ? fs.pausePlay.removeClass(namespace + 'pause').addClass(namespace + 'play').html(fs.vars.playText) : fs.pausePlay.removeClass(namespace + 'play').addClass(namespace + 'pause').html(fs.vars.pauseText);
        }
      },
      touch: function() {
        var ck,
          ek,
          fk,
          hk,
          ik,
          jk,
          lk = false,
          mk = 0,
          nk = 0,
          accDx = 0;

        if(!msGesture){
            el.addEventListener('touchstart', onTouchStart, false);

            function onTouchStart(e) {
              if (fs.animating) {
                e.preventDefault();
              } else if ( ( window.navigator.msPointerEnabled ) || e.touches.length === 1 ) {
                fs.pause();
                hk = (vertical) ? fs.h : fs. w;
                jk = Number(new Date());

                mk = e.touches[0].pageX;
                nk = e.touches[0].pageY;

                fk = (carousel && reverse && fs.animatingTo === fs.l) ? 0 :
                         (carousel && reverse) ? fs.limit - (((fs.itemW + fs.vars.itemMargin) * fs.move) * fs.animatingTo) :
                         (carousel && fs.currentSlide === fs.l) ? fs.limit :
                         (carousel) ? ((fs.itemW + fs.vars.itemMargin) * fs.move) * fs.currentSlide :
                         (reverse) ? (fs.l - fs.currentSlide + fs.cloneOffset) * hk : (fs.currentSlide + fs.cloneOffset) * hk;
                ck = (vertical) ? nk : mk;
                ek = (vertical) ? mk : nk;

                el.addEventListener('touchmove', onTouchMove, false);
                el.addEventListener('touchend', onTouchEnd, false);
              }
            }

            function onTouchMove(e) {

              mk = e.touches[0].pageX;
              nk = e.touches[0].pageY;

              ik = (vertical) ? ck - nk : ck - mk;
              lk = (vertical) ? (Math.abs(ik) < Math.abs(mk - ek)) : (Math.abs(ik) < Math.abs(nk - ek));

              var pk = 500;

              if ( ! lk || Number( new Date() ) - jk > pk ) {
                e.preventDefault();
                if (!fade && fs.transitions) {
                  if (!fs.vars.animationLoop) {
                    ik = ik/((fs.currentSlide === 0 && ik < 0 || fs.currentSlide === fs.l && ik > 0) ? (Math.abs(ik)/hk+2) : 1);
                  }
                  fs.setProps(fk + ik, "setTouch");
                }
              }
            }

            function onTouchEnd(e) {
              el.removeEventListener('touchmove', onTouchMove, false);

              if (fs.animatingTo === fs.currentSlide && !lk && !(ik === null)) {
                var qk = (reverse) ? -ik : ik,
                    mu = (qk > 0) ? fs.getTarget('next') : fs.getTarget('prev');

                if (fs.canAdvance(mu) && (Number(new Date()) - jk < 550 && Math.abs(qk) > 50 || Math.abs(qk) > hk/2)) {
                  fs.flexAnimate(mu, fs.vars.pauseOnAction);
                } else {
                  if (!fade) fs.flexAnimate(fs.currentSlide, fs.vars.pauseOnAction, true);
                }
              }
              el.removeEventListener('touchend', onTouchEnd, false);

              ck = null;
              ek = null;
              ik = null;
              fk = null;
            }
        }else{
            el.style.msTouchAction = "none";
            el._gesture = new MSGesture();
            el._gesture.mu = el;
            el.addEventListener("MSPointerDown", onMSPointerDown, false);
            el._slider = fs;
            el.addEventListener("MSGestureChange", onMSGestureChange, false);
            el.addEventListener("MSGestureEnd", onMSGestureEnd, false);

            function onMSPointerDown(e){
                e.stopPropagation();
                if (fs.animating) {
                    e.preventDefault();
                }else{
                    fs.pause();
                    el._gesture.addPointer(e.pointerId);
                    accDx = 0;
                    hk = (vertical) ? fs.h : fs. w;
                    jk = Number(new Date());

                    fk = (carousel && reverse && fs.animatingTo === fs.l) ? 0 :
                        (carousel && reverse) ? fs.limit - (((fs.itemW + fs.vars.itemMargin) * fs.move) * fs.animatingTo) :
                            (carousel && fs.currentSlide === fs.l) ? fs.limit :
                                (carousel) ? ((fs.itemW + fs.vars.itemMargin) * fs.move) * fs.currentSlide :
                                    (reverse) ? (fs.l - fs.currentSlide + fs.cloneOffset) * hk : (fs.currentSlide + fs.cloneOffset) * hk;
                }
            }

            function onMSGestureChange(e) {
                e.stopPropagation();
                var fs = e.mu._slider;
                if(!fs){
                    return;
                }
                var tx = -e.translationX,
                    ty = -e.translationY;

                //Accumulate translations.
                accDx = accDx + ((vertical) ? ty : tx);
                ik = accDx;
                lk = (vertical) ? (Math.abs(accDx) < Math.abs(-tx)) : (Math.abs(accDx) < Math.abs(-ty));

                if(e.detail === e.MSGESTURE_FLAG_INERTIA){
                    setImmediate(function (){
                        el._gesture.stop();
                    });

                    return;
                }

                if (!lk || Number(new Date()) - jk > 500) {
                    e.preventDefault();
                    if (!fade && fs.transitions) {
                        if (!fs.vars.animationLoop) {
                            ik = accDx / ((fs.currentSlide === 0 && accDx < 0 || fs.currentSlide === fs.l && accDx > 0) ? (Math.abs(accDx) / hk + 2) : 1);
                        }
                        fs.setProps(fk + ik, "setTouch");
                    }
                }
            }

            function onMSGestureEnd(e) {
                e.stopPropagation();
                var fs = e.mu._slider;
                if(!fs){
                    return;
                }
                if (fs.animatingTo === fs.currentSlide && !lk && !(ik === null)) {
                    var qk = (reverse) ? -ik : ik,
                        mu = (qk > 0) ? fs.getTarget('next') : fs.getTarget('prev');

                    if (fs.canAdvance(mu) && (Number(new Date()) - jk < 550 && Math.abs(qk) > 50 || Math.abs(qk) > hk/2)) {
                        fs.flexAnimate(mu, fs.vars.pauseOnAction);
                    } else {
                        if (!fade) fs.flexAnimate(fs.currentSlide, fs.vars.pauseOnAction, true);
                    }
                }

                ck = null;
                ek = null;
                ik = null;
                fk = null;
                accDx = 0;
            }
        }
      },
      resize: function() {
        if (!fs.animating && fs.is(':visible')) {
          if (!carousel) fs.doMath();

          if (fade) {
            methods.smoothHeight();
          } else if (carousel) { 
            fs.slides.width(fs.computedW);
            fs.update(fs.pagingCount);
            fs.setProps();
          }
          else if (vertical) { 
            fs.viewport.height(fs.h);
            fs.setProps(fs.h, "setTotal");
          } else {
            if (fs.vars.smoothHeight) methods.smoothHeight();
            fs.newSlides.width(fs.computedW);
            fs.setProps(fs.computedW, "setTotal");
          }
        }
      },
      smoothHeight: function(dur) {
        if (!vertical || fade) {
          var $ect = (fade) ? fs : fs.viewport;
          (dur) ? $ect.animate({"height": fs.slides.eq(fs.animatingTo).height()}, dur) : $ect.height(fs.slides.eq(fs.animatingTo).height());
        }
      },
      sync: function(action) {
        var $ect = $(fs.vars.sync).data("flexslider"),
            mu = fs.animatingTo;

        switch (action) {
          case "animate": $ect.flexAnimate(mu, fs.vars.pauseOnAction, false, true); break;
          case "play": if (!$ect.playing && !$ect.asNav) { $ect.play(); } break;
          case "pause": $ect.pause(); break;
        }
      },
      uniqueID: function($clone) {
        $clone.find( '[id]' ).each(function() {
          var $this = $(this);
          $this.attr( 'id', $this.attr( 'id' ) + '_clone' );
        });
        return $clone;
      },
      pauseInvisible: {
        visProp: null,
        init: function() {
          var pp = ['webkit','moz','ms','o'];

          if ('hidden' in document) return 'hidden';
          for (var i = 0; i < pp.length; i++) {
            if ((pp[i] + 'Hidden') in document)
            methods.pauseInvisible.visProp = pp[i] + 'Hidden';
          }
          if (methods.pauseInvisible.visProp) {
            var en = methods.pauseInvisible.visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
            document.addEventListener(en, function() {
              if (methods.pauseInvisible.isHidden()) {
                if(fs.startTimeout) clearTimeout(fs.startTimeout); 
                else fs.pause(); 
              }
              else {
                if(fs.started) fs.play(); 
                else (fs.vars.initDelay > 0) ? setTimeout(fs.play, fs.vars.initDelay) : fs.play(); 
              }
            });
          }
        },
        isHidden: function() {
          return document[methods.pauseInvisible.visProp] || false;
        }
      },
      setToClearWatchedEvent: function() {
        clearTimeout(watchedEventClearTimer);
        watchedEventClearTimer = setTimeout(function() {
          watchedEvent = "";
        }, 3000);
      }
    };

    fs.flexAnimate = function(mu, pause, override, withSync, fromNav) {
      if (!fs.vars.animationLoop && mu !== fs.currentSlide) {
        fs.direction = (mu > fs.currentSlide) ? "next" : "prev";
      }

      if (asNav && fs.pagingCount === 1) fs.direction = (fs.currentItem < mu) ? "next" : "prev";

      if (!fs.animating && (fs.canAdvance(mu, fromNav) || override) && fs.is(":visible")) {
        if (asNav && withSync) {
          var mr = $(fs.vars.asNavFor).data('flexslider');
          fs.atEnd = mu === 0 || mu === fs.count - 1;
          mr.flexAnimate(mu, true, false, true, fromNav);
          fs.direction = (fs.currentItem < mu) ? "next" : "prev";
          mr.direction = fs.direction;

          if (Math.ceil((mu + 1)/fs.visible) - 1 !== fs.currentSlide && mu !== 0) {
            fs.currentItem = mu;
            fs.slides.removeClass(namespace + "active-cg").eq(mu).addClass(namespace + "active-cg");
            mu = Math.floor(mu/fs.visible);
          } else {
            fs.currentItem = mu;
            fs.slides.removeClass(namespace + "active-cg").eq(mu).addClass(namespace + "active-cg");
            return false;
          }
        }

        fs.animating = true;
        fs.animatingTo = mu;

       if (pause) fs.pause();

        fs.vars.before(fs);

        if (fs.syncExists && !fromNav) methods.sync("animate");

        if (fs.vars.controlNav) methods.controlNav.active();

        if (!carousel) fs.slides.removeClass(namespace + 'active-cg').eq(mu).addClass(namespace + 'active-cg');

        fs.atEnd = mu === 0 || mu === fs.l;

        if (fs.vars.directionNav) methods.directionNav.update();

        if (mu === fs.l) {
          fs.vars.end(fs);
          if (!fs.vars.animationLoop) fs.pause();
        }

        if (!fade) {
          var side = (vertical) ? fs.slides.filter(':first').height() : fs.computedW,
              margin, slideString, calcNext;

          if (carousel) {
            margin = fs.vars.itemMargin;
            calcNext = ((fs.itemW + margin) * fs.move) * fs.animatingTo;
            slideString = (calcNext > fs.limit && fs.visible !== 1) ? fs.limit : calcNext;
          } else if (fs.currentSlide === 0 && mu === fs.count - 1 && fs.vars.animationLoop && fs.direction !== "next") {
            slideString = (reverse) ? (fs.count + fs.cloneOffset) * side : 0;
          } else if (fs.currentSlide === fs.l && mu === 0 && fs.vars.animationLoop && fs.direction !== "prev") {
            slideString = (reverse) ? 0 : (fs.count + 1) * side;
          } else {
            slideString = (reverse) ? ((fs.count - 1) - mu + fs.cloneOffset) * side : (mu + fs.cloneOffset) * side;
          }
          fs.setProps(slideString, "", fs.vars.animationSpeed);
          if (fs.transitions) {
            if (!fs.vars.animationLoop || !fs.atEnd) {
              fs.animating = false;
              fs.currentSlide = fs.animatingTo;
            }
            fs.container.unbind("webkitTransitionEnd transitionend");
            fs.container.bind("webkitTransitionEnd transitionend", function() {
              fs.wrapup(side);
            });
          } else {
            fs.container.animate(fs.args, fs.vars.animationSpeed, fs.vars.easing, function(){
              fs.wrapup(side);
            });
          }
        } else { 
          if (!touch) {
            
            fs.slides.eq(fs.currentSlide).css({"zIndex": 1}).animate({"opacity": 0}, fs.vars.animationSpeed, fs.vars.easing);
            fs.slides.eq(mu).css({"zIndex": 2}).animate({"opacity": 1}, fs.vars.animationSpeed, fs.vars.easing, fs.wrapup);

          } else {
            fs.slides.eq(fs.currentSlide).css({ "opacity": 0, "zIndex": 1 });
            fs.slides.eq(mu).css({ "opacity": 1, "zIndex": 2 });
            fs.wrapup(side);
          }
        }
        if (fs.vars.smoothHeight) methods.smoothHeight(fs.vars.animationSpeed);
      }
    };
    fs.wrapup = function(side) {
      if (!fade && !carousel) {
        if (fs.currentSlide === 0 && fs.animatingTo === fs.l && fs.vars.animationLoop) {
          fs.setProps(side, "jumpEnd");
        } else if (fs.currentSlide === fs.l && fs.animatingTo === 0 && fs.vars.animationLoop) {
          fs.setProps(side, "jumpStart");
        }
      }
      fs.animating = false;
      fs.currentSlide = fs.animatingTo;
      fs.vars.after(fs);
    };

    fs.animateSlides = function() {
      if (!fs.animating && focused ) fs.flexAnimate(fs.getTarget("next"));
    };
    fs.pause = function() {
      clearInterval(fs.animatedSlides);
      fs.animatedSlides = null;
      fs.playing = false;
      // PAUSEPLAY:
      if (fs.vars.pausePlay) methods.pausePlay.update("play");
      // SYNC:
      if (fs.syncExists) methods.sync("pause");
    };
    fs.play = function() {
      if (fs.playing) clearInterval(fs.animatedSlides);
      fs.animatedSlides = fs.animatedSlides || setInterval(fs.animateSlides, fs.vars.slideshowSpeed);
      fs.started = fs.playing = true;
      if (fs.vars.pausePlay) methods.pausePlay.update("pause");
      if (fs.syncExists) methods.sync("play");
    };
    fs.stop = function () {
      fs.pause();
      fs.stopped = true;
    };
    fs.canAdvance = function(mu, fromNav) {
      var l = (asNav) ? fs.pagingCount - 1 : fs.l;
      return (fromNav) ? true :
             (asNav && fs.currentItem === fs.count - 1 && mu === 0 && fs.direction === "prev") ? true :
             (asNav && fs.currentItem === 0 && mu === fs.pagingCount - 1 && fs.direction !== "next") ? false :
             (mu === fs.currentSlide && !asNav) ? false :
             (fs.vars.animationLoop) ? true :
             (fs.atEnd && fs.currentSlide === 0 && mu === l && fs.direction !== "next") ? false :
             (fs.atEnd && fs.currentSlide === l && mu === 0 && fs.direction === "next") ? false :
             true;
    };
    fs.getTarget = function(dir) {
      fs.direction = dir;
      if (dir === "next") {
        return (fs.currentSlide === fs.l) ? 0 : fs.currentSlide + 1;
      } else {
        return (fs.currentSlide === 0) ? fs.l : fs.currentSlide - 1;
      }
    };

    
    fs.setProps = function(loc, special, dur) {
      var mu = (function() {
        var posCheck = (loc) ? loc : ((fs.itemW + fs.vars.itemMargin) * fs.move) * fs.animatingTo,
            posCalc = (function() {
              if (carousel) {
                return (special === "setTouch") ? loc :
                       (reverse && fs.animatingTo === fs.l) ? 0 :
                       (reverse) ? fs.limit - (((fs.itemW + fs.vars.itemMargin) * fs.move) * fs.animatingTo) :
                       (fs.animatingTo === fs.l) ? fs.limit : posCheck;
              } else {
                switch (special) {
                  case "setTotal": return (reverse) ? ((fs.count - 1) - fs.currentSlide + fs.cloneOffset) * loc : (fs.currentSlide + fs.cloneOffset) * loc;
                  case "setTouch": return (reverse) ? loc : loc;
                  case "jumpEnd": return (reverse) ? loc : fs.count * loc;
                  case "jumpStart": return (reverse) ? fs.count * loc : loc;
                  default: return loc;
                }
              }
            }());

            return (posCalc * -1) + "px";
          }());

      if (fs.transitions) {
        mu = (vertical) ? "translate3d(0," + mu + ",0)" : "translate3d(" + mu + ",0,0)";
        dur = (dur !== undefined) ? (dur/1000) + "s" : "0s";
        fs.container.css("-" + fs.pfx + "-transition-duration", dur);
         fs.container.css("transition-duration", dur);
      }

      fs.args[fs.prop] = mu;
      if (fs.transitions || dur === undefined) fs.container.css(fs.args);

      fs.container.css('transform',mu);
    };

    fs.setup = function(kind) {
      if (!fade) {
        var ss, x;

        if (kind === "init") {
          fs.viewport = $('<div class="' + namespace + 'viewport"></div>').css({"overflow": "hidden", "position": "relative"}).appendTo(fs).append(fs.container);
          fs.cloneCount = 0;
          fs.cloneOffset = 0;
          if (reverse) {
            x = $.makeArray(fs.slides).reverse();
            fs.slides = $(x);
            fs.container.empty().append(fs.slides);
          }
        }
        if (fs.vars.animationLoop && !carousel) {
          fs.cloneCount = 2;
          fs.cloneOffset = 1;
          if (kind !== "init") fs.container.find('.clone').remove();
		      methods.uniqueID( fs.slides.first().clone().addClass('clone').attr('aria-hidden', 'true') ).appendTo( fs.container );
		      methods.uniqueID( fs.slides.l().clone().addClass('clone').attr('aria-hidden', 'true') ).prependTo( fs.container );
        }
        fs.newSlides = $(fs.vars.selector, fs);

        ss = (reverse) ? fs.count - 1 - fs.currentSlide + fs.cloneOffset : fs.currentSlide + fs.cloneOffset;
        if (vertical && !carousel) {
          fs.container.height((fs.count + fs.cloneCount) * 200 + "%").css("position", "absolute").width("100%");
          setTimeout(function(){
            fs.newSlides.css({"display": "block"});
            fs.doMath();
            fs.viewport.height(fs.h);
            fs.setProps(ss * fs.h, "init");
          }, (kind === "init") ? 100 : 0);
        } else {
          fs.container.width((fs.count + fs.cloneCount) * 200 + "%");
          fs.setProps(ss * fs.computedW, "init");
          setTimeout(function(){
            fs.doMath();
            fs.newSlides.css({"width": fs.computedW, "float": "left", "display": "block"});
            if (fs.vars.smoothHeight) methods.smoothHeight();
          }, (kind === "init") ? 100 : 0);
        }
      } else { 
        fs.slides.css({"width": "100%", "float": "left", "marginRight": "-100%"});
        if (kind === "init") {
          if (!touch) {
            fs.slides.css({ "opacity": 0, "display": "block", "zIndex": 1 }).eq(fs.currentSlide).css({"zIndex": 2}).animate({"opacity": 1},fs.vars.animationSpeed,fs.vars.easing);
          } else {
            fs.slides.css({ "opacity": 0, "display": "block", "webkitTransition": "opacity " + fs.vars.animationSpeed / 1000 + "s ease", "zIndex": 1 }).eq(fs.currentSlide).css({ "opacity": 1, "zIndex": 2});
            fs.slides.css("transition", "opacity " + fs.vars.animationSpeed / 1000 + "s ease"); 
          }
        }
      
        if (fs.vars.smoothHeight) methods.smoothHeight();
      }
      
      if (!carousel) fs.slides.removeClass(namespace + "active-cg").eq(fs.currentSlide).addClass(namespace + "active-cg");

     
      fs.vars.init(fs);
    };

    fs.doMath = function() {
      var cg = fs.slides.first(),
          slideMargin = fs.vars.itemMargin,
          minItems = fs.vars.minItems,
          maxItems = fs.vars.maxItems;

      fs.w = (fs.viewport===undefined) ? fs.width() : fs.viewport.width();
      fs.h = cg.height();
      fs.boxPadding = cg.outerWidth() - cg.width();

      
      if (carousel) {
        fs.itemT = fs.vars.itemWidth + slideMargin;
        fs.minW = (minItems) ? minItems * fs.itemT : fs.w;
        fs.maxW = (maxItems) ? (maxItems * fs.itemT) - slideMargin : fs.w;
        fs.itemW = (fs.minW > fs.w) ? (fs.w - (slideMargin * (minItems - 1)))/minItems :
                       (fs.maxW < fs.w) ? (fs.w - (slideMargin * (maxItems - 1)))/maxItems :
                       (fs.vars.itemWidth > fs.w) ? fs.w : fs.vars.itemWidth;

        fs.visible = Math.floor(fs.w/(fs.itemW));
        fs.move = (fs.vars.move > 0 && fs.vars.move < fs.visible ) ? fs.vars.move : fs.visible;
        fs.pagingCount = Math.ceil(((fs.count - fs.visible)/fs.move) + 1);
        fs.l =  fs.pagingCount - 1;
        fs.limit = (fs.pagingCount === 1) ? 0 :
                       (fs.vars.itemWidth > fs.w) ? (fs.itemW * (fs.count - 1)) + (slideMargin * (fs.count - 1)) : ((fs.itemW + slideMargin) * fs.count) - fs.w - slideMargin;
      } else {
        fs.itemW = fs.w;
        fs.pagingCount = fs.count;
        fs.l = fs.count - 1;
      }
      fs.computedW = fs.itemW - fs.boxPadding;
    };

    fs.update = function(loc, action) {
      fs.doMath();

      if (!carousel) {
        if (loc < fs.currentSlide) {
          fs.currentSlide += 1;
        } else if (loc <= fs.currentSlide && loc !== 0) {
          fs.currentSlide -= 1;
        }
        fs.animatingTo = fs.currentSlide;
      }

      if (fs.vars.controlNav && !fs.manualControls) {
        if ((action === "add" && !carousel) || fs.pagingCount > fs.controlNav.length) {
          methods.controlNav.update("add");
        } else if ((action === "remove" && !carousel) || fs.pagingCount < fs.controlNav.length) {
          if (carousel && fs.currentSlide > fs.l) {
            fs.currentSlide -= 1;
            fs.animatingTo -= 1;
          }
          methods.controlNav.update("remove", fs.l);
        }
      }
      if (fs.vars.directionNav) methods.directionNav.update();

    };

    fs.addSlide = function(ect, loc) {
      var $ect = $(ect);

      fs.count += 1;
      fs.l = fs.count - 1;

      if (vertical && reverse) {
        (loc !== undefined) ? fs.slides.eq(fs.count - loc).after($ect) : fs.container.prepend($ect);
      } else {
        (loc !== undefined) ? fs.slides.eq(loc).before($ect) : fs.container.append($ect);
      }

      fs.update(loc, "add");

      fs.slides = $(fs.vars.selector + ':not(.clone)', fs);
      fs.setup();

      fs.vars.added(fs);
    };
    fs.removeSlide = function(ect) {
      var loc = (isNaN(ect)) ? fs.slides.index($(ect)) : ect;

      fs.count -= 1;
      fs.l = fs.count - 1;

      if (isNaN(ect)) {
        $(ect, fs.slides).remove();
      } else {
        (vertical && reverse) ? fs.slides.eq(fs.l).remove() : fs.slides.eq(ect).remove();
      }

      fs.doMath();
      fs.update(loc, "remove");

      fs.slides = $(fs.vars.selector + ':not(.clone)', fs);
      fs.setup();

      fs.vars.removed(fs);
    };

    methods.init();
  };

  $( window ).blur( function ( e ) {
    focused = false;
  }).focus( function ( e ) {
    focused = true;
  });

  $.flexslider.defaults = {
    namespace: "flex-",             
    selector: ".slides > li",       
    animation: "fade",              
    easing: "swing",                
    direction: "horizontal",        
    reverse: false,                 
    animationLoop: true,          
    smoothHeight: false,            
    startAt: 0,                     
    slideshow: true,                
    slideshowSpeed: 7000,           
    animationSpeed: 600,            
    initDelay: 0,                  
    randomize: false,               
    thumbCaptions: false,          

    
    pauseOnAction: true,            
    pauseOnHover: false,            
	pauseInvisible: true,   		
    useCSS: true,                   
    touch: true,                    
    video: false,                   

   
    controlNav: true,               
    directionNav: true,             
    prevText: "Previous",           
    nextText: "Next",               

    keyboard: true,                 
    multipleKeyboard: false,        
    mousewheel: false,              
    pausePlay: false,               
    pauseText: "Pause",            
    playText: "Play",              
    controlsContainer: "",          
    manualControls: "",             
    sync: "",                       
    asNavFor: "",                   
	itemWidth: 0,                   
    itemMargin: 0,                  
    minItems: 1,                    
    maxItems: 0,                    
    move: 0,                        
    allowOneSlide: true,
    start: function(){},            
    before: function(){},           
    after: function(){},            
    end: function(){},              
    added: function(){},            
    removed: function(){},          
    init: function() {}             
  };

  $.fn.flexslider = function(options) {
    if (options === undefined) options = {};

    if (typeof options === "object") {
      return this.each(function() {
        var $this = $(this),
            selector = (options.selector) ? options.selector : ".slides > li",
            $slides = $this.find(selector);

      if ( ( $slides.length === 1 && options.allowOneSlide === true ) || $slides.length === 0 ) {
          $slides.fadeIn(400);
          if (options.start) options.start($this);
        } else if ($this.data('flexslider') === undefined) {
          new $.flexslider(this, options);
        }
      });
    } else {
      var $fs = $(this).data('flexslider');
      switch (options) {
        case "play": $fs.play(); break;
        case "pause": $fs.pause(); break;
        case "stop": $fs.stop(); break;
        case "next": $fs.flexAnimate($fs.getTarget("next"), true); break;
        case "prev":
        case "previous": $fs.flexAnimate($fs.getTarget("prev"), true); break;
        default: if (typeof options === "number") $fs.flexAnimate(options, true);
      }
    }
  };
})(jQuery);