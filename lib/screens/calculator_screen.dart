import 'package:flutter/material.dart';
import '../models/rate_item.dart';

class CalculatorScreen extends StatefulWidget {
  final List<RateItem> items;
  final RateItem? initialItem;

  const CalculatorScreen({
    super.key,
    required this.items,
    this.initialItem,
  });

  @override
  State<CalculatorScreen> createState() => _CalculatorScreenState();
}

class _CalculatorScreenState extends State<CalculatorScreen> {
  late RateItem _selectedItem;
  final TextEditingController _quantityController = TextEditingController(text: '1');
  double _calculatedTotal = 0.0;

  @override
  void initState() {
    super.initState();
    _selectedItem = widget.initialItem ?? widget.items.first;
    _recalculate();
  }

  @override
  void dispose() {
    _quantityController.dispose();
    super.dispose();
  }

  void _recalculate() {
    final qty = double.tryParse(_quantityController.text) ?? 0.0;
    setState(() {
      _calculatedTotal = qty * _selectedItem.currentPrice;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('قیمت کیلکولیٹر (Price Calculator)'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Instruction
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer.withOpacity(0.5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: theme.colorScheme.primary),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'چیز منتخب کریں اور مقدار درج کریں، کُل قیمت فوراً معلوم کریں۔',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Dropdown Item Selector
            const Text(
              'چیز منتخب کریں (Select Item):',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                border: Border.all(color: theme.colorScheme.outlineVariant),
                borderRadius: BorderRadius.circular(12),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<RateItem>(
                  value: _selectedItem,
                  isExpanded: true,
                  icon: const Icon(Icons.arrow_drop_down_rounded),
                  items: widget.items.map((item) {
                    return DropdownMenuItem<RateItem>(
                      value: item,
                      child: Text(
                        '${item.nameUrdu} - Rs ${item.currentPrice.toStringAsFixed(0)} / ${item.unit}',
                        overflow: TextOverflow.ellipsis,
                      ),
                    );
                  }).toList(),
                  onChanged: (newItem) {
                    if (newItem != null) {
                      setState(() {
                        _selectedItem = newItem;
                        _recalculate();
                      });
                    }
                  },
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Quantity Input
            Text(
              'مقدار درج کریں (${_selectedItem.unit}):',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _quantityController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                hintText: 'مثلاً: 1 ya 2.5',
                prefixIcon: const Icon(Icons.scale_rounded),
                suffixText: _selectedItem.unit,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onChanged: (_) => _recalculate(),
            ),
            const SizedBox(height: 16),

            // Quick quantity chips (0.5, 1, 2, 5, 10)
            Wrap(
              spacing: 8,
              children: [0.25, 0.5, 1.0, 2.0, 5.0, 10.0].map((q) {
                return ActionChip(
                  label: Text('$q'),
                  onPressed: () {
                    _quantityController.text = '$q';
                    _recalculate();
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 32),

            // Result Display Card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    theme.colorScheme.primary,
                    theme.colorScheme.secondary,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: theme.colorScheme.primary.withOpacity(0.35),
                    blurRadius: 14,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                children: [
                  const Text(
                    'کُل رقم (Total Amount)',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Rs ${_calculatedTotal.toStringAsFixed(1)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 34,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const Divider(color: Colors.white24, height: 26),
                  Text(
                    '${_quantityController.text.isEmpty ? "0" : _quantityController.text} ${_selectedItem.unit} × Rs ${_selectedItem.currentPrice.toStringAsFixed(1)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
