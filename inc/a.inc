{%literal%}
	{%foreach $array as $item%}
		{%if !empty($item%) || $item@first}
			{%$item%}
		{%else%}
			{%$item|default: 'test'%}
		{%/if%}
	{%/foreach%}
{%literal%}