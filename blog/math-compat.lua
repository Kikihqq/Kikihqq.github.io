-- Expand labeled arrows for texmath while preserving Markdown sources.
function Math(el)
  el.text = el.text:gsub('\\xrightarrow(%b{})', function(label)
    return '\\overset' .. label .. '{\\longrightarrow}'
  end)
  return el
end
