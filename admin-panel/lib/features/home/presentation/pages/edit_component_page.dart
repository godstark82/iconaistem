import 'package:conference_admin/core/models/card_model.dart';
import 'package:conference_admin/core/models/stream_card_model.dart';
import 'package:conference_admin/features/home/data/models/home_component_model.dart';
import 'package:conference_admin/features/home/domain/entities/home_component_entity.dart';
import 'package:conference_admin/features/home/presentation/bloc/home_bloc.dart';
import 'package:conference_admin/features/home/presentation/widgets/sections.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get/get.dart';
import 'package:html_editor_enhanced/html_editor.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';

class EditComponentPage extends StatefulWidget {
  const EditComponentPage({super.key});

  @override
  State<EditComponentPage> createState() => _EditComponentPageState();
}

class _EditComponentPageState extends State<EditComponentPage> {
  final String componentId = Get.parameters['id']!;
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  final HtmlEditorController _htmlController = HtmlEditorController();
  HomeComponentModel? _component;
  bool _isHtmlLoaded = false;
  bool _isEditorReady = false;
  int _selectedOrder = 0;
  Color _selectedColor = Colors.transparent;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _descriptionController = TextEditingController();
    context.read<HomeBloc>().add(GetHomeComponentEvent());
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _loadHtmlContent() {
    if (!_isHtmlLoaded && _component != null && _isEditorReady) {
      _titleController.text = _component!.title;
      _descriptionController.text = _component!.description ?? '';
      _htmlController.setText(_component!.htmlContent);
      _selectedOrder = _component!.order;
      setState(() {
        _selectedColor = _component!.bgColor;
      });
      print(_selectedColor.value);
      _isHtmlLoaded = true;
    }
  }

  void _updateComponent() async {
    if (_formKey.currentState!.validate() && _component != null) {
      final htmlContent = await _htmlController.getText();
      final updatedComponent = _component!.copyWith(
        title: _titleController.text,
        description: _descriptionController.text,
        bgColor: _selectedColor,
        htmlContent: htmlContent,
        order: _selectedOrder
      );

      context.read<HomeBloc>().add(UpdateComponentEvent(updatedComponent));
      Navigator.pop(context);
    }
  }

  void _editCard(CardModel card, int index) {
    final TextEditingController titleController =
        TextEditingController(text: card.title);
    final TextEditingController descController =
        TextEditingController(text: card.description);
    final TextEditingController imageController =
        TextEditingController(text: card.image);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Edit Card'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Focus(
                child: TextFormField(
                  controller: titleController,
                  autofocus: true,
                  decoration: const InputDecoration(
                    labelText: 'Title',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Focus(
                child: TextFormField(
                  controller: descController,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                ),
              ),
              const SizedBox(height: 16),
              Focus(
                child: TextFormField(
                  controller: imageController,
                  decoration: const InputDecoration(
                    labelText: 'Image URL',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              if (_component?.cards != null) {
                setState(() {
                  _component!.cards![index] = CardModel(
                    title: titleController.text,
                    description: descController.text,
                    image: imageController.text,
                  );
                });
              }
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _editStream(StreamCardModel stream, int index) {
    final titleController = TextEditingController(text: stream.title);
    final descriptionsController = TextEditingController(
      text: stream.descriptions?.join('\n') ?? ''
    );

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Edit Stream'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Focus(
                child: TextFormField(
                  controller: titleController,
                  autofocus: true,
                  decoration: const InputDecoration(
                    labelText: 'Title',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Focus(
                child: TextFormField(
                  controller: descriptionsController,
                  decoration: const InputDecoration(
                    labelText: 'Descriptions (one per line)',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 5,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              if (_component?.streamCards != null) {
                setState(() {
                  _component!.streamCards![index] = StreamCardModel(
                    title: titleController.text,
                    descriptions: descriptionsController.text.split('\n')
                      .where((line) => line.trim().isNotEmpty).toList(),
                  );
                });
              }
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _addCard() {
    setState(() {
      _component = _component?.copyWith(cards: _component?.cards ?? []);
      _component?.cards?.add(CardModel(
        title: 'New Card',
        description: 'Description',
        image: '',
      ));
    });
  }

  void _addStream() {
    setState(() {
      _component = _component?.copyWith(streamCards: _component?.streamCards ?? []);
      _component?.streamCards?.add(StreamCardModel(
        title: 'New Stream',
        descriptions: ['Description'],
      ));
    });
  }

  void _removeCard(int index) {
    setState(() {
      _component?.cards?.removeAt(index);
    });
  }

  void _removeStream(int index) {
    setState(() {
      _component?.streamCards?.removeAt(index);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Component'),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: ElevatedButton(
              onPressed: _updateComponent,
              child: const Text('Update'),
            ),
          ),
        ],
      ),
      body: BlocBuilder<HomeBloc, HomeState>(
        builder: (context, state) {
          if (state is HomeComponentsLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is HomeComponentLoaded) {
            _component = state.componentModel
                .firstWhereOrNull((comp) => comp.id == componentId);

            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextFormField(
                      controller: _titleController,
                      decoration: const InputDecoration(
                        labelText: 'Title',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter a title';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _descriptionController,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 3,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Text('Background Color:', 
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)
                        ),
                        const SizedBox(width: 16),
                        GestureDetector(
                          onTap: () {
                            showDialog(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: const Text('Pick a color'),
                                content: SingleChildScrollView(
                                  child: ColorPicker(
                                    pickerColor: _selectedColor,
                                    onColorChanged: (Color color) {
                                      setState(() => _selectedColor = color);
                                    },
                                    enableAlpha: true,
                                  ),
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(context),
                                    child: const Text('Done'),
                                  ),
                                ],
                              ),
                            );
                          },
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: _selectedColor,
                              border: Border.all(color: Colors.grey),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Text('Order:', 
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)
                        ),
                        const SizedBox(width: 16),
                        DropdownButton<int>(
                          value: _selectedOrder,
                          items: List.generate(state.componentModel.length, (index) {
                            return DropdownMenuItem(
                              value: index,
                              child: Text(index.toString()),
                            );
                          }),
                          onChanged: (int? newValue) {
                            if (newValue != null) {
                              setState(() {
                                _selectedOrder = newValue;
                              });
                            }
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Component Type: ${_component?.type.value}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text('HTML Content:'),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 400,
                      child: HtmlEditor(
                        otherOptions: OtherOptions(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey),
                            borderRadius: BorderRadius.circular(8),
                          )
                        ),
                        callbacks: Callbacks(
                          onInit: () {
                            _isEditorReady = true;
                            if (_component != null) {
                              _loadHtmlContent();
                            }
                          }
                        ),
                        controller: _htmlController,
                        htmlEditorOptions: const HtmlEditorOptions(
                          hint: 'Enter your content here...',
                          shouldEnsureVisible: true,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (_component?.type == HomeComponentType.withCards)
                      SectionWidget(
                        title: 'Cards',
                        children: [
                          ..._component?.cards?.asMap().entries.map((entry) {
                                final index = entry.key;
                                final card = entry.value;
                                return Card(
                                  child: ListTile(
                                    leading: card.image != null &&
                                            card.image!.isNotEmpty && 
                                            card.image!.startsWith('http')
                                        ? Image.network(
                                            card.image!,
                                            width: 50,
                                            height: 50,
                                            fit: BoxFit.cover,
                                          )
                                        : const Icon(Icons.image),
                                    title: Text(card.title ?? ''),
                                    subtitle: Text(card.description ?? ''),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.edit),
                                          onPressed: () =>
                                              _editCard(card, index),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.delete),
                                          onPressed: () => _removeCard(index),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }) ??
                              [],
                          ElevatedButton.icon(
                            onPressed: _addCard,
                            icon: const Icon(Icons.add),
                            label: const Text('Add Card'),
                          ),
                        ],
                      ),
                    if (_component?.type == HomeComponentType.withStream)
                      SectionWidget(
                        title: 'Stream Cards',
                        children: [
                          ..._component?.streamCards?.asMap().entries.map((entry) {
                                final index = entry.key;
                                final stream = entry.value;
                                return Card(
                                  child: ListTile(
                                    title: Text(stream.title ?? ''),
                                    subtitle: Text(
                                      stream.descriptions?.join(', ') ?? ''
                                    ),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.edit),
                                          onPressed: () => _editStream(stream, index),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.delete),
                                          onPressed: () => _removeStream(index),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }) ??
                              [],
                          ElevatedButton.icon(
                            onPressed: _addStream,
                            icon: const Icon(Icons.add),
                            label: const Text('Add Stream Card'),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            );
          }

          if (state is HomeComponentError) {
            return Center(child: Text(state.message));
          }

          return const Center(child: Text('Something went wrong'));
        },
      ),
    );
  }
}