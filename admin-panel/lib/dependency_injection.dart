import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:conference_admin/core/services/article_service.dart';
import 'package:conference_admin/features/pages/data/repositories/about_repo_impl.dart';
import 'package:conference_admin/features/pages/domain/repositories/about_repo.dart';
import 'package:conference_admin/features/pages/domain/usecases/create_component_uc.dart';
import 'package:conference_admin/features/pages/domain/usecases/delete_component_uc.dart';
import 'package:conference_admin/features/pages/domain/usecases/get_page_by_id_uc.dart';
import 'package:conference_admin/features/pages/domain/usecases/get_pages_uc.dart';
import 'package:conference_admin/features/pages/domain/usecases/update_component_uc.dart';
import 'package:conference_admin/features/pages/presentation/bloc/about_bloc.dart';
import 'package:conference_admin/features/article/data/repositories/article_repo_impl.dart';
import 'package:conference_admin/features/article/domain/repositories/article_repo.dart';
import 'package:conference_admin/features/article/domain/usecases/add_article_uc.dart';
import 'package:conference_admin/features/article/domain/usecases/delete_article_uc.dart';
import 'package:conference_admin/features/article/domain/usecases/edit_article_uc.dart';
import 'package:conference_admin/features/article/domain/usecases/get_all_article_uc.dart';
import 'package:conference_admin/features/article/domain/usecases/get_article_by_id_uc.dart';
import 'package:conference_admin/features/article/presentation/bloc/article_bloc.dart';
import 'package:conference_admin/features/detailed-schedule/data/repositories/schedule_repo_impl.dart';
import 'package:conference_admin/features/detailed-schedule/domain/repositories/schedule_repo.dart';
import 'package:conference_admin/features/detailed-schedule/domain/usecases/add_schedule_uc.dart';
import 'package:conference_admin/features/detailed-schedule/domain/usecases/delete_schedule_uc.dart';
import 'package:conference_admin/features/detailed-schedule/domain/usecases/get_schedule_uc.dart';
import 'package:conference_admin/features/detailed-schedule/domain/usecases/get_single_schedule_uc.dart';
import 'package:conference_admin/features/detailed-schedule/domain/usecases/update_schedule_uc.dart';
import 'package:conference_admin/features/detailed-schedule/presentation/bloc/detailed_schedule_bloc.dart';
import 'package:conference_admin/features/home/data/repositories/home_repo_impl.dart';
import 'package:conference_admin/features/home/domain/repositories/home_repo.dart';
import 'package:conference_admin/features/home/domain/usecases/create_component_uc.dart';
import 'package:conference_admin/features/home/domain/usecases/delete_component_uc.dart';
import 'package:conference_admin/features/home/domain/usecases/get_home.dart';
import 'package:conference_admin/features/home/domain/usecases/update_component_uc.dart';
import 'package:conference_admin/features/home/domain/usecases/update_display_uc.dart';
import 'package:conference_admin/features/home/presentation/bloc/home_bloc.dart';
import 'package:conference_admin/features/imp-dates/data/repositories/date_repo_impl.dart';
import 'package:conference_admin/features/imp-dates/domain/repositories/date_repo.dart';
import 'package:conference_admin/features/imp-dates/domain/usecases/get_dates_uc.dart';
import 'package:conference_admin/features/imp-dates/domain/usecases/update_dates_uc.dart';
import 'package:conference_admin/features/imp-dates/presentation/bloc/imp_dates_bloc.dart';
import 'package:get_it/get_it.dart';
import 'package:conference_admin/features/login/data/repositories/login_repo_impl.dart';
import 'package:conference_admin/features/login/domain/repositories/login_repo.dart';
import 'package:conference_admin/features/login/domain/usecases/login_usecase.dart';
import 'package:conference_admin/features/login/domain/usecases/logout_usecase.dart';

import 'package:conference_admin/features/login/presentation/bloc/login_bloc.dart';
import 'package:conference_admin/features/users/data/repositories/users_repo_impl.dart';
import 'package:conference_admin/features/users/domain/repositories/users_repo.dart';
import 'package:conference_admin/features/users/domain/usecases/get_all_users_usecase.dart';
import 'package:conference_admin/features/users/domain/usecases/get_specific_user_usecase.dart';
import 'package:conference_admin/features/users/presentation/bloc/users_bloc.dart';
import 'package:conference_admin/core/services/login/login_service.dart';
import 'package:conference_admin/core/services/users_service.dart';

final sl = GetIt.instance;

Future<void> initializeDependencies() async {
  //! Firebase
  sl.registerSingleton<FirebaseFirestore>(FirebaseFirestore.instance);

  //! Services
  sl.registerSingleton<LoginService>(LoginService());
  sl.registerSingleton<UsersService>(UsersService());
  sl.registerSingleton<ArticleService>(ArticleService());

  //! Repositories
  sl.registerSingleton<DateRepo>(DateRepoImpl(firestore: sl()));
  sl.registerSingleton<HomeRepo>(HomeRepoImpl(firestore: sl()));
  sl.registerSingleton<LoginRepo>(LoginRepoImpl(sl()));
  sl.registerSingleton<AboutRepo>(AboutRepoImpl(firestore: sl()));
  sl.registerSingleton<UsersRepo>(UsersRepoImpl(sl()));
  sl.registerSingleton<ScheduleRepo>(ScheduleRepoImpl());
  sl.registerSingleton<ArticleRepository>(ArticleRepoImpl(sl()));

  //! Usecases
  //? About UseCases
  sl.registerSingleton<GetAboutPageByIdUsecase>(GetAboutPageByIdUsecase(sl()));
  sl.registerSingleton<GetAboutPagesUsecase>(GetAboutPagesUsecase(sl()));
  sl.registerSingleton<UpdateAboutPageUsecase>(UpdateAboutPageUsecase(sl()));
  sl.registerSingleton<DeleteAboutPageUsecase>(DeleteAboutPageUsecase(sl()));
  sl.registerSingleton<CreateAboutPageUsecase>(CreateAboutPageUsecase(sl()));



  //? Home UseCases
  sl.registerSingleton<UpdateComponentUsecase>(UpdateComponentUsecase(sl()));
  sl.registerSingleton<CreateComponentUsecase>(CreateComponentUsecase(sl()));
  sl.registerSingleton<DeleteComponentUsecase>(DeleteComponentUsecase(sl()));
  sl.registerSingleton<UpdateDisplayUsecase>(UpdateDisplayUsecase(sl()));
  sl.registerSingleton<GetHomeComponentsUsecase>(
      GetHomeComponentsUsecase(sl()));

  //? Important Dates UseCases
  sl.registerSingleton<GetDatesUseCase>(GetDatesUseCase(sl()));
  sl.registerSingleton<UpdateDatesUseCase>(UpdateDatesUseCase(sl()));

  //? Login Usecases
  sl.registerSingleton<LoginUsecase>(LoginUsecase(sl()));
  sl.registerSingleton<LogoutUsecase>(LogoutUsecase(sl()));
  sl.registerSingleton<GetAllUsersUseCase>(GetAllUsersUseCase(sl()));
  sl.registerSingleton<GetSpecificUserUsecase>(GetSpecificUserUsecase(sl()));

  //? Detailed Schedule Usecases
  sl.registerSingleton<GetAllScheduleUseCase>(GetAllScheduleUseCase(sl()));
  sl.registerSingleton<AddScheduleUseCase>(AddScheduleUseCase(sl()));
  sl.registerSingleton<UpdateScheduleUseCase>(UpdateScheduleUseCase(sl()));
  sl.registerSingleton<DeleteScheduleUseCase>(DeleteScheduleUseCase(sl()));
  sl.registerSingleton<GetSingleScheduleUseCase>(
      GetSingleScheduleUseCase(sl()));

  //? Article UseCases
  sl.registerSingleton<GetAllArticleUC>(GetAllArticleUC(sl()));
  sl.registerSingleton<AddArticleUC>(AddArticleUC(sl()));
  sl.registerSingleton<EditArticleUC>(EditArticleUC(sl()));
  sl.registerSingleton<DeleteArticleUC>(DeleteArticleUC(sl()));
  sl.registerSingleton<GetArticleByIdUC>(GetArticleByIdUC(sl()));

  //! Blocs
  //! About Blocs
  sl.registerFactory<AboutBloc>(() => AboutBloc(sl(), sl(), sl(), sl(), sl()));
  sl.registerFactory<HomeBloc>(() => HomeBloc(sl(), sl(), sl(), sl(), sl()));
  sl.registerFactory<ImpDatesBloc>(() => ImpDatesBloc(sl(), sl()));
  sl.registerFactory<LoginBloc>(() => LoginBloc(sl(), sl(), sl()));
  sl.registerFactory<UsersBloc>(() => UsersBloc(sl(), sl()));
  sl.registerFactory<DetailedScheduleBloc>(
      () => DetailedScheduleBloc(sl(), sl(), sl(), sl(), sl()));
  sl.registerFactory<ArticleBloc>(
      () => ArticleBloc(sl(), sl(), sl(), sl(), sl()));
}
