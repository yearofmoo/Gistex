var Gistex = function() {

  var self, C = {

    options : {
      showOnReady : true,
      iframeClassName : 'gist-iframe',
      innerClassName : 'gist-stage',
      timeout : 10000
    },

    initialize : function(container,src,options) {
      if(typeof src == 'object') {
        src = self.prepareSrc(src.file,src.id);
      }
      self.container = container;
      self.src = src;

      self.mergeOptions(options);
    },

    mergeOptions : function(options) {
      if(!self.options) {
        self.options = {};
      }
      options = options || {};
      for(var key in options) {
        var value = options[key];
        self.options[key]=value;
      }
    },

    resetVariables : function() {
      self.loaded = false;
      self.cancelled = false;
      self.timedOut = false;
    },

    load : function() {
      self.resetVariables();
      var container = self.getContainer();
      container.innerHTML = '';

      self.onLoading();
      var iframe = this.getIFrame();
      self.injectIFrameHTML(iframe);
    },

    getContainer : function() {
      return self.container;
    },

    getIFrameDocument : function() {
      iframe = self.getIFrame();
      return iframe.contentDocument || iframe.contentWindow.document;
    },

    prepareSrc : function(file,id) {
      return 'https://gist.github.com/' + id + '.js?file=' + file
    },

    getSrc : function() {
      return self.src;
    },

    getID : function() {
      if(!self.id) {
        self.id = 'gist-' + new Date().getTime();
      }
      return self.id;
    },

    getInnerID : function() {
      return this.getID() + '-inner';
    },

    getInnerElement : function() {
      return self.innerElement;
    },

    getInnerElementHTML : function() {
      return self.getInnerElement().innerHTML;
    },

    getGistElement : function() {
      var elm, kids = self.getInnerElement().childNodes;

      for(var i=0;i < kids.length;i++) {
        var kid = kids[i];
        var tag = kid.nodeName.toLowerCase();
        var className = kid.className.toString() ? kid.className : '';
        if(tag == 'div' && className == 'gist') {
          elm = kid;
          break;
        }
      }

      return elm;
    },

    getIFrame : function() {
      if(!self.iframe) {
        var iframe = document.createElement('iframe');
        iframe.id = this.getID();
        iframe.className = self.options.iframeClassName;
        iframe.style.width = 0;
        iframe.style.height = 0;
        iframe.style.border = 0;
        iframe.frameborder = 0;
        iframe.scrolling = 'no';
        self.getContainer().appendChild(iframe);
        self.iframe = iframe;
      }
      return self.iframe;
    },

    injectIFrameHTML : function(iframe) {
      var id = self.getID();
      var innerID = self.getInnerID();
      var src = this.getSrc();

      var opera = /Opera\/\d+\.\d+/.test(navigator.userAgent);

      var that = self;
      Gistex.callbacks[id] = function(id) {
        if(!opera) {
          that.innerElement = that.getIFrameDocument().getElementById(innerID);
        }
        that.onIFrameLoaded.apply(that,[id]);
      };

      self.startTimer();

      var doc = this.getIFrameDocument();
      doc.open('text/html',false);

      var html = '<html><head>';
      if(opera) {

        self.innerElementHTML = '';
        self.getInnerElementHTML = function() {
          return self.innerElementHTML;
        }

        Gistex.buffers[id] = function(content) {
          self.innerElementHTML += content;
        };

        html += '<script type="text/javascript">' + 
                'document.write = function(content) {'+
                ' window.parent.Gistex.buffers["'+id+'"](content);'+
                '};' +
                '</script>';
      }
      html += '</head><body onload="window.parent.Gistex.callbacks[\'' + id + '\'](\'' + id + '\');">' +
              '<div class="'+self.options.innerClassName+'" id="'+innerID+'">' +
              "<script type='text/javascript' src='"+src+"'></script>" + 
              '</div>' +
              "</body></html>";
      doc.write(html);
      doc.close();
    },

    onIFrameLoaded : function(id) {
      if(!self.timedOut && !self.cancelled) {

        self.loaded = true;
        self.endTimer();

        var iframe = document.getElementById(id);
        var container = self.getContainer();
        var doc = self.getIFrameDocument();
        var html = this.getInnerElementHTML().replace(/^\s+|\s+$/g,"");
        alert(html);

        if(html.length > 0) {
          container.innerHTML = '';
          var elm = document.createElement('div');
          elm.className = self.options.innerClassName;
          elm.innerHTML = html;
          container.appendChild(elm);
          self.onReady();
        }
        else {
          self.onFailure();
        }
      }
    },

    show : function() {
      self.getContainer().style.display = 'block';
    },

    hide : function() {
      self.getContainer().style.display = 'none';
    },

    startTimer : function() {
      var fn = function() {
        self.onTimeout.apply(self);
      }
      self.timer = setTimeout(fn,self.options.timeout);
    },

    endTimer : function() {
      if(self.timer) {
        clearTimeout(self.timer);
      }
      self.timer = null;
    },

    cancel : function() {
      if(!self.loaded) {
        self.cancelled = true;
        self.endTimer();
        self.onCancel();
      }
    },

    onCancel : function() {
      self.fire('cancel');
    },

    onFailure : function() {
      self.fire('failure');
    },

    onTimeout : function() {
      self.fire('timeout');
    },

    onLoading : function() {
      self.fire('loading');
    },

    onReady : function() {
      self.fire('ready');
    },

    fire : function(method) {
      method = 'on' + method.charAt(0).toUpperCase() + method.substr(1);
      var fn = self.options[method];
      if(fn) {
        fn();
      }
    }
  };

  self = C;

  C.initialize.apply(this,arguments);

  return C;

};

Gistex.buffers = {};
Gistex.callbacks = {};
