import 'package:flutter/material.dart';
import '../services/update_service.dart';

class UpdateDialog extends StatefulWidget {
  final UpdateInfo updateInfo;

  const UpdateDialog({super.key, required this.updateInfo});

  @override
  State<UpdateDialog> createState() => _UpdateDialogState();
}

class _UpdateDialogState extends State<UpdateDialog> {
  bool _isDownloading = false;
  bool _isDownloadComplete = false;
  String? _downloadedApkPath;
  double _progress = 0.0;
  String _progressText = '0%';
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    // Check if APK already downloaded for this version
    _checkCachedApk();
  }

  Future<void> _checkCachedApk() async {
    final cached = await UpdateService.getCachedApkPath(widget.updateInfo.latestVersion);
    if (cached != null && mounted) {
      setState(() {
        _isDownloadComplete = true;
        _downloadedApkPath = cached;
      });
    }
  }

  Future<void> _startDownload() async {
    setState(() {
      _isDownloading = true;
      _isDownloadComplete = false;
      _errorMessage = null;
    });

    try {
      final apkPath = await UpdateService.downloadApk(
        downloadUrl: widget.updateInfo.apkDownloadUrl,
        version: widget.updateInfo.latestVersion,
        onProgress: (progress, text) {
          if (mounted) {
            setState(() {
              _progress = progress;
              _progressText = text;
            });
          }
        },
      );
      if (mounted) {
        setState(() {
          _isDownloading = false;
          _isDownloadComplete = true;
          _downloadedApkPath = apkPath;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isDownloading = false;
          _errorMessage = 'ڈاؤنلوڈ میں مسئلہ آیا، دوبارہ کوشش کریں۔';
        });
      }
    }
  }

  Future<void> _installApk() async {
    if (_downloadedApkPath != null) {
      await UpdateService.installApk(_downloadedApkPath!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.system_update_rounded, color: theme.colorScheme.primary),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'نیا اپڈیٹ دستیاب ہے!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'نیا ورژن: v${widget.updateInfo.latestVersion} (موجودہ: v${UpdateService.currentVersion})',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.primary,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceVariant.withOpacity(0.4),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                widget.updateInfo.releaseNotes.isNotEmpty
                    ? widget.updateInfo.releaseNotes
                    : 'نیا ورژن بہتر رفتار اور نئی سہولیات کے ساتھ دستیاب ہے۔',
                style: const TextStyle(fontSize: 13),
              ),
            ),
            const SizedBox(height: 16),

            if (_isDownloading) ...[
              LinearProgressIndicator(
                value: _progress > 0 ? _progress : null,
                minHeight: 8,
                borderRadius: BorderRadius.circular(4),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  _progressText,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.primary,
                  ),
                ),
              ),
            ],

            if (_errorMessage != null) ...[
              const SizedBox(height: 8),
              Text(
                _errorMessage!,
                style: const TextStyle(color: Colors.red, fontSize: 12),
              ),
            ],
          ],
        ),
      ),
      actions: [
        if (_isDownloadComplete) ...[
          // APK downloaded — show Install button
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('بعد میں'),
          ),
          FilledButton.icon(
            icon: const Icon(Icons.install_mobile_rounded, size: 18),
            label: const Text('ابھی انسٹال کریں'),
            style: FilledButton.styleFrom(backgroundColor: Colors.green),
            onPressed: _installApk,
          ),
        ] else if (_isDownloading) ...[
          // Downloading in progress
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'ڈاؤنلوڈ ہو رہا ہے، براہ کرم انتظار کریں...',
                style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic),
              ),
            ),
          ),
        ] else ...[
          // Not downloaded yet
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('بعد میں (Later)'),
          ),
          FilledButton.icon(
            icon: const Icon(Icons.download_rounded, size: 18),
            label: const Text('ابھی اپڈیٹ کریں'),
            onPressed: _startDownload,
          ),
        ],
      ],
    );
  }
}
