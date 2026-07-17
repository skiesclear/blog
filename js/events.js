/* global Fluid */

HTMLElement.prototype.wrap = function(wrapper) {
  this.parentNode.insertBefore(wrapper, this);
  this.parentNode.removeChild(this);
  wrapper.appendChild(this);
};

Fluid.events = {

  registerNavbarEvent: function() {
    var navbar = jQuery('#navbar');
    if (navbar.length === 0) {
      return;
    }
    var body = jQuery('body');
    var toggleButton = jQuery('#navbar-toggler-btn');
    var storageKey = 'Fluid_Sidebar_Nav_Collapsed';

    var isDesktop = function() {
      return window.innerWidth >= 992;
    };

    var setLS = function(k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    };

    var getLS = function(k) {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    };

    var syncToggleState = function() {
      var expanded = isDesktop()
        ? !body.hasClass('sidebar-nav-collapsed')
        : body.hasClass('sidebar-nav-open');
      toggleButton.toggleClass('sidebar-toggle-expanded', expanded);
      toggleButton.attr('aria-expanded', expanded ? 'true' : 'false');
    };

    var applyStoredState = function() {
      body.removeClass('sidebar-nav-open mobile-menu-open');
      if (isDesktop()) {
        if (body.hasClass('page-fixed-nav')) {
          body.removeClass('sidebar-nav-collapsed');
        } else {
          body.addClass('sidebar-nav-collapsed');
        }
      } else {
        body.removeClass('sidebar-nav-collapsed');
      }
      syncToggleState();
    };

    applyStoredState();

    toggleButton.on('click', function() {
      var $this = jQuery(this);
      if ($this.data('animating')) {
        return;
      }
      $this.data('animating', true);

      if (isDesktop()) {
        if (body.hasClass('page-fixed-nav')) {
          $this.data('animating', false);
          return;
        }
        body.toggleClass('sidebar-nav-collapsed');
        setLS(storageKey, body.hasClass('sidebar-nav-collapsed') ? 'true' : 'false');
      } else {
        body.toggleClass('sidebar-nav-open');
      }
      syncToggleState();

      setTimeout(function() {
        $this.data('animating', false);
      }, 300);
    });

    navbar.on('click', 'a[href]:not([href="javascript:;"])', function() {
      if (!isDesktop()) {
        body.removeClass('sidebar-nav-open');
        syncToggleState();
      }
    });

    jQuery('#sidebar-nav-backdrop').on('click', function() {
      body.removeClass('sidebar-nav-open');
      syncToggleState();
    });

    var qrcodePopover = jQuery('#navbar-qrcode-popover');
    navbar.on('click', '.navbar-social-qrcode', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var button = this;
      var qrcode = button.getAttribute('data-qrcode');
      if (!qrcode) {
        return;
      }
      var img = qrcodePopover.find('img');
      img.removeAttr('srcset').removeAttr('lazyload').attr('src', qrcode);
      qrcodePopover.addClass('show');

      var rect = button.getBoundingClientRect();
      var popoverWidth = qrcodePopover.outerWidth();
      var popoverHeight = qrcodePopover.outerHeight();
      var left = Math.min(window.innerWidth - popoverWidth - 12, rect.right + 12);
      var top = Math.min(window.innerHeight - popoverHeight - 12, rect.top - 10);
      if (left < 12) {
        left = 12;
      }
      if (top < 12) {
        top = 12;
      }
      qrcodePopover.css({ left: left + 'px', top: top + 'px' });
    });

    jQuery(document).on('click', function(e) {
      if (!qrcodePopover.hasClass('show')) {
        return;
      }
      if (qrcodePopover[0].contains(e.target) || jQuery(e.target).closest('.navbar-social-qrcode').length > 0) {
        return;
      }
      qrcodePopover.removeClass('show');
    });

    jQuery(window).on('resize', function() {
      qrcodePopover.removeClass('show');
      applyStoredState();
    });
  },

  registerParallaxEvent: function() {
    var ph = jQuery('#banner[parallax="true"]');
    if (ph.length === 0) {
      return;
    }
    var board = jQuery('#board');
    if (board.length === 0) {
      return;
    }
    var parallax = function() {
      var pxv = jQuery(window).scrollTop() / 5;
      var offset = parseInt(board.css('margin-top'), 10);
      var max = 96 + offset;
      if (pxv > max) {
        pxv = max;
      }
      ph.css({
        transform: 'translate3d(0,' + pxv + 'px,0)'
      });
      var sideCol = jQuery('.side-col');
      if (sideCol) {
        sideCol.css({
          'padding-top': pxv + 'px'
        });
      }
    };
    Fluid.utils.listenScroll(parallax);
  },

  registerScrollDownArrowEvent: function() {
    var scrollbar = jQuery('.scroll-down-bar');
    if (scrollbar.length === 0) {
      return;
    }
    scrollbar.on('click', function() {
      Fluid.utils.scrollToElement('#board', -jQuery('#navbar').height());
    });
  },

  registerScrollTopArrowEvent: function() {
    var topArrow = jQuery('#scroll-top-button');
    if (topArrow.length === 0) {
      return;
    }
    var board = jQuery('#board');
    if (board.length === 0) {
      return;
    }
    var posDisplay = false;
    var scrollDisplay = false;
    // Position
    var setTopArrowPos = function() {
      var boardRight = board[0].getClientRects()[0].right;
      var bodyWidth = document.body.offsetWidth;
      var right = bodyWidth - boardRight;
      posDisplay = right >= 50;
      topArrow.css({
        'bottom': posDisplay && scrollDisplay ? '20px' : '-60px',
        'right' : right - 64 + 'px'
      });
    };
    setTopArrowPos();
    jQuery(window).resize(setTopArrowPos);
    // Display
    var headerHeight = board.offset().top;
    Fluid.utils.listenScroll(function() {
      var scrollHeight = document.body.scrollTop + document.documentElement.scrollTop;
      scrollDisplay = scrollHeight >= headerHeight;
      topArrow.css({
        'bottom': posDisplay && scrollDisplay ? '20px' : '-60px'
      });
    });
    // Click
    topArrow.on('click', function() {
      jQuery('body,html').animate({
        scrollTop: 0,
        easing   : 'swing'
      });
    });
  },

  registerImageLoadedEvent: function() {
    if (!('NProgress' in window)) { return; }

    var bg = document.getElementById('banner');
    if (bg) {
      var src = bg.style.backgroundImage;
      var url = src.match(/\((.*?)\)/)[1].replace(/(['"])/g, '');
      var img = new Image();
      img.onload = function() {
        window.NProgress && window.NProgress.status !== null && window.NProgress.inc(0.2);
      };
      img.src = url;
      if (img.complete) { img.onload(); }
    }

    var notLazyImages = jQuery('main img:not([lazyload])');
    var total = notLazyImages.length;
    for (const img of notLazyImages) {
      const old = img.onload;
      img.onload = function() {
        old && old();
        window.NProgress && window.NProgress.status !== null && window.NProgress.inc(0.5 / total);
      };
      if (img.complete) { img.onload(); }
    }
  },

  registerRefreshCallback: function(callback) {
    if (!Array.isArray(Fluid.events._refreshCallbacks)) {
      Fluid.events._refreshCallbacks = [];
    }
    Fluid.events._refreshCallbacks.push(callback);
  },

  refresh: function() {
    if (Array.isArray(Fluid.events._refreshCallbacks)) {
      for (var callback of Fluid.events._refreshCallbacks) {
        if (callback instanceof Function) {
          callback();
        }
      }
    }
  },

  billboard: function() {
    if (!('console' in window)) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log(`
-------------------------------------------------
|                                               |
|      ________  __            _        __      |
|     |_   __  |[  |          (_)      |  ]     |
|       | |_ \\_| | | __   _   __   .--.| |      |
|       |  _|    | |[  | | | [  |/ /'\`\\' |      |
|      _| |_     | | | \\_/ |, | || \\__/  |      |
|     |_____|   [___]'.__.'_/[___]'.__.;__]     |
|                                               |
|            Powered by Hexo x Fluid            |
| https://github.com/fluid-dev/hexo-theme-fluid |
|                                               |
-------------------------------------------------
    `);
  }
};
