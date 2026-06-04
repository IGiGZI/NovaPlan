import 'package:flutter/material.dart';
import 'widgets/gradient_button.dart';
class UserProfileScreen extends StatefulWidget {
  const UserProfileScreen({super.key});
  @override
  State<UserProfileScreen> createState() => _UserProfileScreenState();}
class _UserProfileScreenState extends State<UserProfileScreen> {
  final TextEditingController _nameController = TextEditingController(text: "  "); //  حالياً
  final TextEditingController _passwordController = TextEditingController();
  bool isEditing = false;
  bool isLoading = false;
  void _handleUpdate() async {
    setState(() => isLoading = true);    
    await Future.delayed(const Duration(seconds: 1)); //  للوقت
    if (mounted) {
      setState(() {
        isLoading = false;
        isEditing = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Profile Updated Successfully"), backgroundColor: Colors.green),     ); }}
  void _confirmDelete() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E2F),
        title: const Text("Delete Account?", style: TextStyle(color: Colors.white)),
        content: const Text("This action is permanent. All your roadmaps will be lost.", style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancel")),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.of(context).pop(); // العودة للشاشة السابقة
            }, 
            child: const Text("Delete", style: TextStyle(color: Colors.redAccent))      ),       ],     ),    );  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1E),
      appBar: AppBar(
        title: const Text("MY PROFILE", style: TextStyle(letterSpacing: 1.5, fontSize: 16)),
        backgroundColor: Colors.transparent,
        elevation: 0,      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Center(
              child: Stack(
                children: [
                  Container(
                    width: 120, height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.cyanAccent, width: 2),
                      boxShadow: [BoxShadow(color: Colors.cyanAccent.withOpacity(0.2), blurRadius: 20)],
                    ),
                    child: const Icon(Icons.person, size: 80, color: Colors.white24),
                  ),
                  Positioned(
                    bottom: 0, right: 0,
                    child: CircleAvatar(
                      backgroundColor: Colors.cyanAccent,
                      radius: 18,
                      child: IconButton(
                        icon: const Icon(Icons.camera_alt, size: 18, color: Colors.black),
                        onPressed: () {},             ),                  ),                 )        ],         ),           ),
            const SizedBox(height: 40),
            _buildGlassCard(
              child: Column(
                children: [
                  _buildProfileField("Full Name", _nameController, Icons.person, isEditing),
                  const SizedBox(height: 20),
                  _buildProfileField("New Password", _passwordController, Icons.lock, isEditing, isPass: true),             ],             ),            ),
            const SizedBox(height: 30),
            if (!isEditing)
              GradientButton(
                text: "EDIT PROFILE",
                onTap: () => setState(() => isEditing = true),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _handleUpdate,
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.cyanAccent, foregroundColor: Colors.black, padding: const EdgeInsets.all(15)),
                      child: isLoading ? const CircularProgressIndicator() : const Text("SAVE"),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => isEditing = false),
                      style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.white24), padding: const EdgeInsets.all(15)),
                      child: const Text("CANCEL", style: TextStyle(color: Colors.white)),                 ),          ),            ],             ),
            const SizedBox(height: 50),
            TextButton.icon(
              onPressed: _confirmDelete,
              icon: const Icon(Icons.delete_forever, color: Colors.redAccent),
              label: const Text("Delete Account Permanently", style: TextStyle(color: Colors.redAccent)),
            ),      ],  ),     ),   );}
  Widget _buildGlassCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: Colors.white.withOpacity(0.08)),  ),
      child: child,   );}
  Widget _buildProfileField(String label, TextEditingController controller, IconData icon, bool enabled, {bool isPass = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white38, fontSize: 12)),
        TextField(
          controller: controller,
          enabled: enabled,
          obscureText: isPass,
          style: const TextStyle(color: Colors.white, fontSize: 16),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: Colors.cyanAccent, size: 20),
            border: InputBorder.none,
            hintText: "Enter $label",
            hintStyle: const TextStyle(color: Colors.white10),     ),      ),      ]  ); }}