import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../models/rate_item.dart';

class PriceHistorySheet extends StatelessWidget {
  final RateItem item;

  const PriceHistorySheet({super.key, required this.item});

  static void show(BuildContext context, RateItem item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => PriceHistorySheet(item: item),
    );
  }

  void _shareItem(BuildContext context) {
    final text = '''
📢 *Rozana Rate - روزانہ ریٹ اپڈیٹ*
🛒 چیز: ${item.nameUrdu}
💰 آج کا ریٹ: Rs ${item.currentPrice >= 1000 ? item.currentPrice.toStringAsFixed(0) : item.currentPrice.toStringAsFixed(1)} / ${item.unit}
📊 پچھلے 7 دنوں کا کم سے کم ریٹ: Rs ${item.lowestIn7Days.toStringAsFixed(0)}
📈 پچھلے 7 دنوں کا زیادہ سے زیادہ ریٹ: Rs ${item.highestIn7Days.toStringAsFixed(0)}
📍 شہر: ${item.city}

Rozana Rate ایپ ڈاؤنلوڈ کریں اور روزانہ ریٹس اپڈیٹ حاصل کریں۔
''';
    Share.share(text, subject: 'Rozana Rate Update - ${item.nameUrdu}');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final history = item.history7Days.isNotEmpty ? item.history7Days : [item.previousPrice, item.currentPrice];
    final isDrop = item.currentPrice <= item.previousPrice;
    final chartColor = isDrop ? const Color(0xFF0D7A57) : Colors.red.shade700;

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 44,
              height: 5,
              decoration: BoxDecoration(
                color: theme.colorScheme.outlineVariant,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header with item name and share button
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(item.category.icon, color: theme.colorScheme.primary, size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.nameUrdu,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      '${item.unit} • ${item.grade}',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
              IconButton.filledTonal(
                tooltip: 'واٹس ایپ پر شیئر کریں',
                icon: const Icon(Icons.share_rounded),
                onPressed: () => _shareItem(context),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Current Price and 7-day stats
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'آج کا ریٹ',
                  'Rs ${item.currentPrice >= 1000 ? item.currentPrice.toStringAsFixed(0) : item.currentPrice.toStringAsFixed(1)}',
                  theme.colorScheme.primary,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildStatCard(
                  'کم سے کم (7 Days)',
                  'Rs ${item.lowestIn7Days >= 1000 ? item.lowestIn7Days.toStringAsFixed(0) : item.lowestIn7Days.toStringAsFixed(0)}',
                  Colors.green.shade700,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildStatCard(
                  'زیادہ سے زیادہ',
                  'Rs ${item.highestIn7Days >= 1000 ? item.highestIn7Days.toStringAsFixed(0) : item.highestIn7Days.toStringAsFixed(0)}',
                  Colors.orange.shade800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // 7-Day Chart Box
          const Text(
            'پچھلے 7 دنوں کا قیمت کا گراف (Price Trend):',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          Container(
            height: 160,
            padding: const EdgeInsets.fromLTRB(10, 16, 10, 8),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: theme.colorScheme.outlineVariant.withOpacity(0.4)),
            ),
            child: CustomPaint(
              size: const Size(double.infinity, 150),
              painter: _SparklineChartPainter(
                data: history,
                lineColor: chartColor,
              ),
            ),
          ),
          const SizedBox(height: 8),

          // Day labels
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('6 دن پہلے', style: TextStyle(fontSize: 11, color: Colors.grey)),
              Text('5 دن', style: TextStyle(fontSize: 11, color: Colors.grey)),
              Text('4 دن', style: TextStyle(fontSize: 11, color: Colors.grey)),
              Text('3 دن', style: TextStyle(fontSize: 11, color: Colors.grey)),
              Text('2 دن', style: TextStyle(fontSize: 11, color: Colors.grey)),
              Text('کل', style: TextStyle(fontSize: 11, color: Colors.grey)),
              Text('آج (Today)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0D7A57))),
            ],
          ),
          const SizedBox(height: 20),

          // Share to WhatsApp Full Width Button
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF25D366), // WhatsApp Green
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            icon: const Icon(Icons.share_rounded, color: Colors.white),
            label: const Text(
              'واٹس ایپ پر ریٹ شیئر کریں (Share on WhatsApp)',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
            onPressed: () => _shareItem(context),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 10, color: Colors.grey.shade600, fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }
}

class _SparklineChartPainter extends CustomPainter {
  final List<double> data;
  final Color lineColor;

  _SparklineChartPainter({required this.data, required this.lineColor});

  @override
  void paint(Canvas canvas, Size size) {
    if (data.length < 2) return;

    final min = data.reduce((a, b) => a < b ? a : b);
    final max = data.reduce((a, b) => a > b ? a : b);
    final range = (max - min) == 0 ? 1.0 : (max - min);

    final path = Path();
    final fillPath = Path();

    final stepX = size.width / (data.length - 1);

    final points = <Offset>[];
    for (int i = 0; i < data.length; i++) {
      final x = i * stepX;
      // Leave padding at top and bottom
      final normalizedY = (data[i] - min) / range;
      final y = size.height - (normalizedY * (size.height - 30)) - 15;
      points.add(Offset(x, y));
    }

    path.moveTo(points.first.dx, points.first.dy);
    fillPath.moveTo(points.first.dx, size.height);
    fillPath.lineTo(points.first.dx, points.first.dy);

    for (int i = 1; i < points.length; i++) {
      final prev = points[i - 1];
      final curr = points[i];
      final midX = (prev.dx + curr.dx) / 2;
      path.cubicTo(midX, prev.dy, midX, curr.dy, curr.dx, curr.dy);
      fillPath.cubicTo(midX, prev.dy, midX, curr.dy, curr.dx, curr.dy);
    }

    fillPath.lineTo(points.last.dx, size.height);
    fillPath.close();

    // Fill gradient
    final gradient = LinearGradient(
      colors: [lineColor.withOpacity(0.3), lineColor.withOpacity(0.0)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    );
    final fillPaint = Paint()
      ..shader = gradient.createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.fill;
    canvas.drawPath(fillPath, fillPaint);

    // Line
    final linePaint = Paint()
      ..color = lineColor
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(path, linePaint);

    // Draw dots and text on each point
    final dotPaint = Paint()..color = lineColor;
    final dotInner = Paint()..color = Colors.white;

    for (int i = 0; i < points.length; i++) {
      final pt = points[i];
      canvas.drawCircle(pt, 5, dotPaint);
      canvas.drawCircle(pt, 2.5, dotInner);

      // Draw price text on last and first point
      if (i == 0 || i == points.length - 1) {
        final textSpan = TextSpan(
          text: data[i].toStringAsFixed(0),
          style: TextStyle(
            color: lineColor,
            fontSize: 10,
            fontWeight: FontWeight.bold,
          ),
        );
        final tp = TextPainter(
          text: textSpan,
          textDirection: TextDirection.ltr,
        )..layout();
        tp.paint(canvas, Offset(pt.dx - (tp.width / 2), pt.dy - 16));
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SparklineChartPainter oldDelegate) => true;
}
