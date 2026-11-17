import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/rate_item.dart';
import '../data/sample_data.dart';
import '../widgets/rate_card.dart';
import 'calculator_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _selectedCity = SampleData.availableCities.first;
  RateCategory? _selectedCategory; // null = All
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  late List<RateItem> _allItems;
  bool _isRefreshing = false;

  @override
  void initState() {
    super.initState();
    _loadItems();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _loadItems() {
    _allItems = SampleData.getItems(_selectedCity);
  }

  Future<void> _refreshData() async {
    setState(() => _isRefreshing = true);
    await Future.delayed(const Duration(milliseconds: 700));
    if (mounted) {
      setState(() {
        _loadItems();
        _isRefreshing = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تازہ ترین ریٹس اپڈیٹ ہو چکے ہیں! (Rates Updated)'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  List<RateItem> get _filteredItems {
    return _allItems.where((item) {
      final matchesCategory = _selectedCategory == null || item.category == _selectedCategory;
      final query = _searchQuery.trim().toLowerCase();
      final matchesSearch = query.isEmpty ||
          item.nameUrdu.toLowerCase().contains(query) ||
          item.nameEn.toLowerCase().contains(query);
      return matchesCategory && matchesSearch;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final todayFormatted = DateFormat('EEEE, d MMMM yyyy').format(DateTime.now());

    // Highlight key summary items
    final petrolItem = _allItems.firstWhere((i) => i.id == 'fuel1', orElse: () => _allItems.first);
    final dollarItem = _allItems.firstWhere((i) => i.id == 'cur1', orElse: () => _allItems.first);
    final goldItem = _allItems.firstWhere((i) => i.id == 'gold1', orElse: () => _allItems.first);
    final chickenItem = _allItems.firstWhere((i) => i.id == 'm2', orElse: () => _allItems.first);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Text(
                  'Rozana Rate',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20),
                ),
                SizedBox(width: 8),
                Text(
                  'روزانہ ریٹ',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.normal),
                ),
              ],
            ),
            Text(
              todayFormatted,
              style: TextStyle(
                fontSize: 12,
                color: theme.colorScheme.onSurface.withOpacity(0.7),
              ),
            ),
          ],
        ),
        actions: [
          // City selector button
          PopupMenuButton<String>(
            tooltip: 'شہر منتخب کریں (Select City)',
            icon: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.location_on_rounded, color: theme.colorScheme.primary, size: 20),
                const SizedBox(width: 4),
                Text(
                  _selectedCity.split(' ').first,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.primary,
                    fontSize: 13,
                  ),
                ),
                const Icon(Icons.arrow_drop_down, size: 20),
              ],
            ),
            onSelected: (city) {
              setState(() {
                _selectedCity = city;
                _loadItems();
              });
            },
            itemBuilder: (context) {
              return SampleData.availableCities.map((city) {
                return PopupMenuItem(
                  value: city,
                  child: Text(
                    city,
                    style: TextStyle(
                      fontWeight: city == _selectedCity ? FontWeight.bold : FontWeight.normal,
                      color: city == _selectedCity ? theme.colorScheme.primary : null,
                    ),
                  ),
                );
              }).toList();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshData,
        child: CustomScrollView(
          slivers: [
            // Top Quick Highlights Cards (Petrol, Dollar, Gold, Chicken)
            SliverToBoxAdapter(
              child: SizedBox(
                height: 105,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  children: [
                    _buildSummaryMiniCard(
                      context,
                      title: 'پٹرول (Petrol)',
                      price: 'Rs ${petrolItem.currentPrice}',
                      unit: petrolItem.unit,
                      icon: Icons.local_gas_station_rounded,
                      color: Colors.amber.shade800,
                    ),
                    _buildSummaryMiniCard(
                      context,
                      title: 'ڈالر (USD)',
                      price: 'Rs ${dollarItem.currentPrice}',
                      unit: dollarItem.unit,
                      icon: Icons.currency_exchange_rounded,
                      color: Colors.blue.shade700,
                    ),
                    _buildSummaryMiniCard(
                      context,
                      title: 'سونا 24K (Gold)',
                      price: 'Rs ${goldItem.currentPrice.toStringAsFixed(0)}',
                      unit: 'فی تولہ',
                      icon: Icons.diamond_rounded,
                      color: Colors.orange.shade700,
                    ),
                    _buildSummaryMiniCard(
                      context,
                      title: 'مرغی گوشت (Chicken)',
                      price: 'Rs ${chickenItem.currentPrice}',
                      unit: chickenItem.unit,
                      icon: Icons.set_meal_rounded,
                      color: Colors.teal.shade700,
                    ),
                  ],
                ),
              ),
            ),

            // Search Bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'تلاش کریں (ٹماٹر، پٹرول، سونا، چینی...)',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: theme.colorScheme.surfaceVariant.withOpacity(0.4),
                    contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: (val) {
                    setState(() => _searchQuery = val);
                  },
                ),
              ),
            ),

            // Category Horizontal Tabs
            SliverToBoxAdapter(
              child: SizedBox(
                height: 48,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        selected: _selectedCategory == null,
                        label: const Text('سب ریٹس (All)'),
                        onSelected: (_) {
                          setState(() => _selectedCategory = null);
                        },
                      ),
                    ),
                    ...RateCategory.values.map((cat) {
                      final isSelected = _selectedCategory == cat;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          selected: isSelected,
                          avatar: Icon(cat.icon, size: 16),
                          label: Text('${cat.labelUrdu} (${cat.labelEn})'),
                          onSelected: (_) {
                            setState(() {
                              _selectedCategory = isSelected ? null : cat;
                            });
                          },
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),

            // Item count & status bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${_filteredItems.length} اشیاء کے سرکاری ریٹ',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    Text(
                      'کلک کر کے حساب کریں',
                      style: TextStyle(
                        fontSize: 12,
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // List of Rate Cards
            if (_filteredItems.isEmpty)
              const SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.search_off_rounded, size: 54, color: Colors.grey),
                      SizedBox(height: 12),
                      Text(
                        'کوئی چیز نہیں ملی (No items found)',
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final item = _filteredItems[index];
                    return RateCard(
                      item: item,
                      onCalculate: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => CalculatorScreen(
                              items: _allItems,
                              initialItem: item,
                            ),
                          ),
                        );
                      },
                    );
                  },
                  childCount: _filteredItems.length,
                ),
              ),

            const SliverToBoxAdapter(
              child: SizedBox(height: 80),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.calculate_rounded),
        label: const Text('کیلکولیٹر (Calculator)'),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => CalculatorScreen(
                items: _allItems,
                initialItem: _filteredItems.isNotEmpty ? _filteredItems.first : _allItems.first,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSummaryMiniCard(
    BuildContext context, {
    required String title,
    required String price,
    required String unit,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      width: 150,
      margin: const EdgeInsets.only(right: 10),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 5),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                price,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                  color: color,
                ),
              ),
              Text(
                unit,
                style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
