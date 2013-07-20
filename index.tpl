<!DOCTYPE html>
<html>
<head>
	<title>js复用smarty模板 样例</title>
</head>
<body>
	{%capture "template_string"%}
		{%include file="inc/a.inc"%}
	{%/capture%}
	{%$template_string = $smarty.capture.template_string%}

	{%include file="string:$template_string"%}

	<div id="more">
		
	</div>

<script type="text/tmpl" id="aTmpl">
	{%include file="inc/a.inc"%}
</script>
<script type="text/javascript" src="js/tmpl.js"></script>
<script type="text/javascript">
	var tmplFun = Tmpl($('#aTmpl'), 'data');
	Ajax.get('url', function (data) {
		var tmpl = tmplFun(data);
		$('#more').html(tmpl);
	});
</script>
</body>
</html>