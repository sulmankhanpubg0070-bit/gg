import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/rate_item.dart';
import '../data/sample_data.dart';
import '../widgets/rate_card.dart';
import '../widgets/update_dialog.dart';
import '../services/update_service.dart';
import 'calculator_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentTabIndex = 0;
  String _selectedCity = SampleData.availableCities.first;
  RateCategory? _selectedCategory; // null = All
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  late List<RateItem> _allItems;
  RateItem? _calculatorSelectedItem;
  bool _isRefreshing = false;

  @override
  void initState() {
    super.initState();
    _loadItems();
    // Auto-check for OTA updates silently in the background
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkUpdateSilently();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _loadItems() {
    _allItems = SampleData.getItems(_selectedCity);
  }

  Future<void> _checkUpdateSilently() async {
    final updateInfo = await UpdateService.checkForUpdate();
    if (updateInfo != null && mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => UpdateDialog(updateInfo: updateInfo),
      );
    }
  }

  Future<void> _checkUpdateManually() async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('اپڈیٹ چیک کی جا رہی ہے... (Checking for updates...)'),
        duration: Duration(seconds: 1),
      ),
    );

    final updateInfo = await UpdateService.checkForUpdate();
    if (!mounted) return;

    if (updateInfo != null) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => UpdateDialog(updateInfo: updateInfo),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('آپ کی ایپ پہلے سے بالکل اپڈیٹ ہے! (v${UpdateService.currentVersion})'),
          backgroundColor: const Color(0xFF0D7A57),
          duration: const Duration(seconds: 3),
        ),
      );
    }
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

      // IndexedStack preserves state across bottom navigation tabs
      body: IndexedStack(
        index: _currentTabIndex,
        children: [
          // Tab 0: Daily Rates Explorer
          _buildRatesTab(context),

          // Tab 1: Fixed Calculator Tab
          CalculatorScreen(
            items: _allItems,
            initialItem: _calculatorSelectedItem ?? _allItems.first,
            isTab: true,
          ),

          // Tab 2: Updates & Settings Tab
          _buildUpdatesTab(context),
        ],
      ),

      // Fixed 3-button Bottom Navigation Bar
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentTabIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentTabIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.trending_up_rounded),
            selectedIcon: Icon(Icons.trending_up_rounded, color: Color(0xFF0D7A57)),
            label: 'ریٹس (Rates)',
          ),
          NavigationDestination(
            icon: Icon(Icons.calculate_outlined),
            selectedIcon: Icon(Icons.calculate_rounded, color: Color(0xFF0D7A57)),
            label: 'کیلکولیٹر (Calc)',
          ),
          NavigationDestination(
            icon: Icon(Icons.system_update_outlined),
            selectedIcon: Icon(Icons.system_update_rounded, color: Color(0xFF0D7A57)),
            label: 'اپڈیٹس (Updates)',
          ),
        ],
      ),
    );
  }

  // --- TAB 0: RATES VIEW ---
  Widget _buildRatesTab(BuildContext context) {
    final theme = Theme.of(context);
    final petrolItem = _allItems.firstWhere((i) => i.id == 'fuel1', orElse: () => _allItems.first);
    final dollarItem = _allItems.firstWhere((i) => i.id == 'cur1', orElse: () => _allItems.first);
    final goldItem = _allItems.firstWhere((i) => i.id == 'gold1', orElse: () => _allItems.first);
    final chickenItem = _allItems.firstWhere((i) => i.id == 'm2', orElse: () => _allItems.first);

    return RefreshIndicator(
      onRefresh: _refreshData,
      child: CustomScrollView(
        slivers: [
          // Highlights Mini Cards
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

          // Category Chips
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
                      setState(() {
                        _calculatorSelectedItem = item;
                        _currentTabIndex = 1; // switch to Calculator tab!
                      });
                    },
                  );
                },
                childCount: _filteredItems.length,
              ),
            ),

          const SliverToBoxAdapter(
            child: SizedBox(height: 20),
          ),
        ],
      ),
    );
  }

  // --- TAB 2: UPDATES & SETTINGS VIEW ---
  Widget _buildUpdatesTab(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // App Logo and Version Card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: theme.colorScheme.outlineVariant.withOpacity(0.5)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0D7A57).withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.storefront_rounded, size: 38, color: Color(0xFF0D7A57)),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Rozana Rate (روزانہ ریٹ)',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceVariant,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'ورژن (Version): v${UpdateService.currentVersion}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
                const SizedBox(height: 20),

                // Check for updates button
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF0D7A57),
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  icon: const Icon(Icons.sync_rounded),
                  label: const Text(
                    'ابھی اپڈیٹ چیک کریں (Check for Update)',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  onPressed: _checkUpdateManually,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Features List Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: theme.colorScheme.outlineVariant.withOpacity(0.4)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'ایپ کی خصوصیات (Features):',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const SizedBox(height: 12),
                _buildFeatureRow('🚀 In-App OTA Auto-Update سسٹم فعال ہے'),
                _buildFeatureRow('🥦 روزانہ تازہ ترین منڈی اور اوگرا ریٹس'),
                _buildFeatureRow('🧮 کُل قیمت معلوم کرنے کے لیے ان بلٹ کیلکولیٹر'),
                _buildFeatureRow('📍 پاکستان کے تمام بڑے شہروں کی سپورٹ'),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Footer note
          Center(
            child: Text(
              'تیار کردہ: Rozana Rate Team • تمام حقوق محفوظ ہیں',
              style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureRow(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded, size: 18, color: Color(0xFF0D7A57)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 13),
            ),
          ),
        ],
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
