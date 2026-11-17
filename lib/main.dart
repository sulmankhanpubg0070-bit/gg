import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const RozanaRateApp());
}

class RozanaRateApp extends StatelessWidget {
  const RozanaRateApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Primary green brand color (symbolic of agriculture, fresh market, and currency)
    const seedColor = Color(0xFF0D7A57);

    return MaterialApp(
      title: 'Rozana Rate (روزانہ ریٹ)',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.system,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: seedColor,
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xFFF7F9F8),
        appBarTheme: const AppBarTheme(
          elevation: 0,
          scrolledUnderElevation: 2,
          backgroundColor: Colors.white,
          centerTitle: false,
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: seedColor,
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF121413),
        appBarTheme: const AppBarTheme(
          elevation: 0,
          scrolledUnderElevation: 2,
          backgroundColor: Color(0xFF1A1D1B),
          centerTitle: false,
        ),
      ),
      home: const HomeScreen(),
    );
  }
}
