/* global ajaxurl */

var azlink = (function() {
    
    // if this API is used by a wordpress plugin, then it will use the ajax_url,
    // otherwise, use the url defined by the programmer in connect() method...
    var ajaxUrl = ajaxurl;

    function connect(url) {
        ajaxUrl = url;
        return this;
    }

    function execute(ajaxdata, callback) {

        try {

            if(!ajaxUrl) throw 'request URL is not present.';
            
            $.ajax({
               type : 'POST',
               url : ajaxUrl,
               data : ajaxdata,
               success : function (data, textStatus, jqXHR) {
                   callback(data);
               },
               error : function() {
                   alert("AZlink encountered a problem, please check the data or the request url for errors");
               }
            });

        }catch(err) {
            alert("AZlink error: " + err);
        }
    }

    return {
        connect : connect,
        execute : execute
    };

})();