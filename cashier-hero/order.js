var ORDER_STATE = {
  lines: []
};
var SALES_TAX_RATE = 0.05;

function addItemToOrder(item, selections) {
  var pricedLine = priceItemWithSelections(item, selections);
  ORDER_STATE.lines.push(pricedLine);
}

function removeOrderLine(index) {
  if (index < 0 || index >= ORDER_STATE.lines.length) {
    return;
  }
  ORDER_STATE.lines.splice(index, 1);
}

function clearOrder() {
  ORDER_STATE.lines = [];
}

function getOrderSubtotal() {
  var subtotal = 0;
  var i = 0;

  for (i = 0; i < ORDER_STATE.lines.length; i += 1) {
    subtotal += ORDER_STATE.lines[i].total;
  }

  return subtotal;
}

function getOrderTax() {
  return getOrderSubtotal() * SALES_TAX_RATE;
}

function getOrderTotal() {
  return getOrderSubtotal() + getOrderTax();
}

function priceItemWithSelections(item, selections) {
  var total = item.basePrice;
  var detailLabels = [];
  var sizeLabel = "";
  var normalizedSelections = cloneSelections(selections || {});
  var g = 0;
  var o = 0;
  var group = null;
  var option = null;
  var selectedValue = null;
  var qty = 0;

  for (g = 0; g < item.modifiers.length; g += 1) {
    group = item.modifiers[g];
    selectedValue = selections[group.id];

    if (group.selection === "single") {
      option = findOptionById(group.options, selectedValue);
      if (option) {
        total += option.priceDelta;
        if (isSizeGroup(group)) {
          sizeLabel = option.label;
        } else {
          detailLabels.push(option.label);
        }
      }
      continue;
    }

    for (o = 0; o < group.options.length; o += 1) {
      option = group.options[o];

      if (option.inputType === "plus/minus") {
        qty = getQuantityValue(selectedValue, option.id);
        if (qty > 0) {
          total += option.priceDelta * qty;
          detailLabels.push(option.label + " x" + qty);
        }
        continue;
      }

      if (isMultiOptionSelected(selectedValue, option.id)) {
        total += option.priceDelta;
        detailLabels.push(option.label);
      }
    }
  }

  return {
    itemId: item.id,
    name: item.label,
    size: sizeLabel,
    details: detailLabels.join(", "),
    label: buildLineLabel(item.label, sizeLabel, detailLabels),
    selections: normalizedSelections,
    total: total
  };
}

function cloneSelections(selections) {
  return JSON.parse(JSON.stringify(selections || {}));
}

function findOptionById(options, id) {
  var i = 0;
  for (i = 0; i < options.length; i += 1) {
    if (options[i].id === id) {
      return options[i];
    }
  }
  return null;
}

function getQuantityValue(groupSelection, optionId) {
  if (!groupSelection || typeof groupSelection !== "object") {
    return 0;
  }
  if (!groupSelection[optionId]) {
    return 0;
  }
  return Number(groupSelection[optionId]);
}

function isMultiOptionSelected(groupSelection, optionId) {
  if (!groupSelection || typeof groupSelection !== "object") {
    return false;
  }
  return Boolean(groupSelection[optionId]);
}

function isSizeGroup(group) {
  var groupId = String(group.id || "").toLowerCase();
  var groupLabel = String(group.label || "").toLowerCase();
  return groupId.indexOf("size") !== -1 || groupLabel === "size";
}

function buildLineLabel(itemLabel, sizeLabel, detailLabels) {
  var parts = [];
  if (sizeLabel) {
    parts.push(sizeLabel);
  }
  if (detailLabels.length > 0) {
    parts.push(detailLabels.join(", "));
  }
  if (parts.length === 0) {
    return itemLabel;
  }
  return itemLabel + " (" + parts.join(", ") + ")";
}

function money(value) {
  return "$" + Number(value).toFixed(2);
}
