import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';

class UpdateInfo {
  final String latestVersion;
  final String releaseNotes;
  final String apkDownloadUrl;
  final int apkSizeBytes;

  UpdateInfo({
    required this.latestVersion,
    required this.releaseNotes,
    required this.apkDownloadUrl,
    required this.apkSizeBytes,
  });
}

class UpdateService {
  // Current app version installed
  static const String currentVersion = '1.0.1';

  // GitHub repository details
  static const String githubRepo = 'sulmankhanpubg0070-bit/gg';

  /// Checks GitHub Releases API for any newer version
  static Future<UpdateInfo?> checkForUpdate() async {
    try {
      final url = Uri.parse('https://api.github.com/repos/$githubRepo/releases/latest');
      final response = await http.get(url, headers: {
        'Accept': 'application/vnd.github.v3+json',
      }).timeout(const Duration(seconds: 8));

      if (response.statusCode != 200) {
        return null;
      }

      final data = jsonDecode(response.body);
      final rawTag = (data['tag_name'] as String? ?? '').replaceAll('v', '').trim();
      final notes = data['body'] as String? ?? 'Naye features aur behtariyan shamil ki gayi hain.';
      
      final assets = data['assets'] as List<dynamic>? ?? [];
      String downloadUrl = '';
      int apkSize = 0;

      for (var asset in assets) {
        final name = asset['name'] as String? ?? '';
        if (name.endsWith('.apk')) {
          downloadUrl = asset['browser_download_url'] as String? ?? '';
          apkSize = asset['size'] as int? ?? 0;
          break;
        }
      }

      // If no APK found in assets, fallback to generic latest release direct download
      if (downloadUrl.isEmpty) {
        downloadUrl = 'https://github.com/$githubRepo/releases/latest/download/RozanaRate.apk';
      }

      // Compare versions
      if (_isNewerVersion(rawTag, currentVersion)) {
        return UpdateInfo(
          latestVersion: rawTag,
          releaseNotes: notes,
          apkDownloadUrl: downloadUrl,
          apkSizeBytes: apkSize,
        );
      }

      return null;
    } catch (_) {
      // Offline or network error
      return null;
    }
  }

  /// Downloads the APK and directly triggers Android's Package Installer
  static Future<void> downloadAndInstallApk({
    required String downloadUrl,
    required Function(double progress, String progressText) onProgress,
  }) async {
    final client = http.Client();
    final request = http.Request('GET', Uri.parse(downloadUrl));
    final response = await client.send(request);

    final totalBytes = response.contentLength ?? 0;
    int receivedBytes = 0;

    final tempDir = await getTemporaryDirectory();
    final apkFile = File('${tempDir.path}/RozanaRate.apk');
    if (await apkFile.exists()) {
      await apkFile.delete();
    }

    final sink = apkFile.openWrite();

    await response.stream.listen((chunk) {
      sink.add(chunk);
      receivedBytes += chunk.length;

      double progress = 0.0;
      String text = '';

      if (totalBytes > 0) {
        progress = receivedBytes / totalBytes;
        final receivedMb = (receivedBytes / (1024 * 1024)).toStringAsFixed(1);
        final totalMb = (totalBytes / (1024 * 1024)).toStringAsFixed(1);
        text = '$receivedMb MB / $totalMb MB (${(progress * 100).toInt()}%)';
      } else {
        final receivedMb = (receivedBytes / (1024 * 1024)).toStringAsFixed(1);
        text = '$receivedMb MB downloaded';
      }

      onProgress(progress, text);
    }).asFuture();

    await sink.close();
    client.close();

    // Trigger Android Native Package Installer
    await OpenFilex.open(
      apkFile.path,
      type: 'application/vnd.android.package-archive',
    );
  }

  static bool _isNewerVersion(String latest, String current) {
    if (latest.isEmpty) return false;
    final latestParts = latest.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    final currentParts = current.split('.').map((e) => int.tryParse(e) ?? 0).toList();

    for (int i = 0; i < latestParts.length && i < currentParts.length; i++) {
      if (latestParts[i] > currentParts[i]) return true;
      if (latestParts[i] < currentParts[i]) return false;
    }
    return latestParts.length > currentParts.length;
  }
}
